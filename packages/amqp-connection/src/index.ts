// tslint:disable:object-literal-sort-keys

import * as codec from '@microfleet/amqp-codec';
import assert = require('assert');
import eventToPromise = require('event-to-promise');
import { EventEmitter } from 'events';
import Joi = require('joi');
import net = require('net');
import os = require('os');
import readPkgUp = require('read-pkg-up');
import RC = require('reconnect-core');
import tls = require('tls');
import netConnector from './connectors/net';
import tlsConnector from './connectors/tls';
import {
  HeartbeatError,
  ServerCloseRequest,
  ServerErrorMismatch,
} from './errors';

const { pkg } = readPkgUp.sync({ cwd: __dirname });

export interface IAMQPConnectionConfiguration {
  hosts: Array<{ host: string, port: number }>;
  heartbeat: number;
  tls: boolean;
  tlsOptions: tls.TlsOptions;
  reconnect: boolean;
  login: string;
  password: string;
  vhost: string;
  reconnectOptions: RC.IConfigurationOptions;
  clientProperties: IClientProperties;
  socketOptions: {
    keepAlive?: boolean;
    noDelay?: boolean;
    setTimeout?: number;
  };
}

export interface IOptionalConfiguration {
  heartbeat?: number;
  hosts: IAMQPConnectionConfiguration['hosts'];
  tls?: boolean;
  tlsOptions?: tls.TlsOptions;
  reconnect?: boolean;
  login?: string;
  password?: string;
  vhost?: string;
  reconnectOptions?: RC.IConfigurationOptions;
  socketOptions?: IAMQPConnectionConfiguration['socketOptions'];
  clientProperties?: IAMQPConnectionConfiguration['clientProperties'];
}

export interface IClientProperties {
  version: string;
  platform: string;
  product: string;
  capabilities: {
    [capability: string]: boolean;
  };
}

export interface IServerProperties {
  product: string;
  version: string;
  capabitilies: {
    [capability: string]: boolean;
  };
}

const connectionOptions = Joi
  .object({
    clientProperties: Joi.object({
      version: Joi.string().default(pkg.version),
      platform: Joi.string().default(os.hostname() + '-node-' + process.version),
      product: Joi.string().default(pkg.name),
      capabilities: Joi.object({
        consumer_cancel_notify: Joi.boolean().default(true),
      }).default().unknown(true),
    }).default(),
    heartbeat: Joi.number().default(10000),
    hosts: Joi.array()
      .items(Joi.object({
        host: Joi.string().required(),
        port: Joi.number().integer().required(),
      }))
      .required()
      .min(1),
    login: Joi.string().default('guest'),
    password: Joi.string().default('guest'),
    reconnect: Joi.boolean().default(true),
    reconnectOptions: Joi.object({
      failAfter: Joi.number().integer().default(Infinity),
      initialDelay: Joi.number().integer().default(100),
      maxDelay: Joi.number().integer().default(30000),
      randomisationFactor: Joi.number(),
      strategy: Joi.string(),
      type: [Joi.string(), Joi.func()],
    }).default().unknown(false),
    socketOptions: Joi.object({
      keepAlive: Joi.boolean().default(true),
      noDelay: Joi.boolean().default(true),
      setTimeout: Joi.number().integer().default(3000),
    }).default(),
    tls: Joi.boolean().default(false),
    tlsOptions: Joi.object().unknown(true),
    vhost: Joi.string().default('/'),
  })
  .default();

type Timer = NodeJS.Timer & { refresh?(): void } | null;
type Socket = net.Socket | tls.TLSSocket;

const enum ConnectionStatus {
  CLOSED,
  CONNECTING,
  CONNECTED,
}

class Reconnectable extends EventEmitter {
  public serverProperties: IServerProperties = Object.create(null);

  private config: IAMQPConnectionConfiguration;
  private connector: RC.IInitiateConnection;
  private reconnectable: RC.IReconnectableConnection;
  private stream: Socket | null = null;
  private machineIndex: number = 0;
  private mutableConnectionOptions: tls.TlsOptions | net.NetConnectOpts = {};
  private parser: codec.Parser;
  private serializer: codec.Serializer;
  private incomingHearbeatTimer: Timer = null;
  private outgoingHeartbeatTimer: Timer = null;
  private disconnectTimer: Timer = null;
  private cache: { [key: string]: Buffer } = Object.create(null);
  private serverChannelMax: number = 0;
  private state: ConnectionStatus = ConnectionStatus.CLOSED;

  constructor(opts: IOptionalConfiguration) {
    super();
    this.config = Joi.attempt(opts, connectionOptions) as IAMQPConnectionConfiguration;

    // bind functions
    this.onConnect = this.onConnect.bind(this);
    this.onMissedHearbeat = this.onMissedHearbeat.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
    this.handleResponse = this.handleResponse.bind(this);

    this.parser = new codec.Parser({ handleResponse: this.handleResponse });
    this.serializer = new codec.Serializer();

    this.connector = this.config.tls ? tlsConnector : netConnector;
    this.reconnectable = this.connector(this.config.reconnectOptions);
    this.reconnectable.reconnect = this.config.reconnect;
    this.reconnectable.on('reconnect', this.onReconnect.bind(this));
    this.reconnectable.on('disconnect', this.onDisconnect.bind(this));
    this.reconnectable.on('error', this.onError.bind(this));
    this.reconnectable.on('connect', this.onConnect);

    // populate cache with some useful buffers
    this.cache.kConnectionClose = this.serializer.encode(codec.ServiceChannel, {
      type: codec.FrameType.METHOD,
      method: codec.Protocol.methods.connectionClose,
      args: { classId: 0, methodId: 0, replyCode: 200, replyText: 'closed' },
    });

    this.cache.kConnectionAuth = this.serializer.encode(codec.ServiceChannel, {
      type: codec.FrameType.METHOD,
      method: codec.Protocol.methods.connectionStartOk,
      args: {
        mechanism: 'AMQPLAIN',
        locale: 'en_US',
        clientProperties: this.config.clientProperties,
        response: { LOGIN: this.config.login, PASSWORD: this.config.password },
      },
    });
  }

  // Public interface
  public async connect() {
    // prepare tls connection options if we are doing it
    if (this.config.tls) {
      Object.assign(this.mutableConnectionOptions, this.config.tlsOptions);
    }

    // ensure host is set
    Object.assign(this.mutableConnectionOptions, this.config.hosts[this.machineIndex]);

    this.reconnectable.connect(this.mutableConnectionOptions, this.config.socketOptions);
    await eventToPromise(this, 'ready');
  }

  public async disconnect() {
    // graceful shutdown
    if (this.stream !== null) {
      // request graceful close
      if (this.state === ConnectionStatus.CONNECTED) {
        this.stream.write(this.cache.kConnectionClose);
      } else {
        this.reconnectable.disconnect();
      }
    }

    // mark as to not reconnect
    this.reconnectable.reconnect = false;

    // if we are already disconnected - we are already done
    if (this.reconnectable.connected === false) {
      return;
    }

    if (this.disconnectTimer === null) {
      const timeout = this.config.socketOptions.setTimeout || 2500;
      this.disconnectTimer = setTimeout(this.destroyStream.bind(this), timeout);
    }

    // if not - wait for the promise
    await eventToPromise(this.reconnectable, 'disconnect');
  }

  /**
   * Receives
   */
  private handleResponse(frameChannel: number, data: codec.ParsedResponse): void {
    if (data instanceof Error) {
      this.emit('error', data, frameChannel);
      return;
    }

    // any type of incoming data resets heartbeat timer
    this.onHeartbeat();

    // skip heartbeat frame
    if (data.type === codec.FrameType.HEARTBEAT) {
      return;
    }

    // channel can have header/body stuff, 0 is underlaying connection
    // and can only have method
    if (frameChannel > codec.ServiceChannel) {
      // TODO: channel specific logic
      return;
    }

    // ensure that we do not get some weird shit here
    assert.equal(data.type, codec.FrameType.METHOD, `invalid frame type for channel 0: ${data.type}`);
    const { method, args } = data as codec.IMethodFrame;

    switch (method) {
      case codec.Protocol.methods.connectionStart:
        if (args.versionMajor !== 0 && args.versionMinor !== 9) {
          this.emit('error', new ServerErrorMismatch(args));
          return;
        }

        this.serverProperties = args.serverProperties;
        this.send(this.cache.kConnectionAuth);
        return;

      case codec.Protocol.methods.connectionTune:
        if (typeof args.channelMax === 'number') {
          this.setChannelMax(args.channelMax);
        }

        if (typeof args.frameMax === 'number') {
          this.serializer.setMaxFrameSize(args.frameMax);
        }

        this.send(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionTuneOk,
          args: {
            channelMax: this.serverChannelMax,
            frameMax: this.serializer.maxFrameSize,
            heartbeat: this.config.heartbeat / 1000,
          },
        }));

        this.send(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionOpen,
          args: { virtualHost: this.config.vhost },
        }));

        return;

      case codec.Protocol.methods.connectionOpenOk:
        this.emit('ready');
        return;

      case codec.Protocol.methods.connectionClose:
        this.send(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionCloseOk,
          args: {},
        }));

        if (this.stream !== null) {
          const error = new ServerCloseRequest(args.replyText, args.replyCode);
          this.stream.emit('error', error);
        }
        return;

      case codec.Protocol.methods.connectionCloseOk:
        this.destroyStream();
        return;

      default:
        throw new Error(`no matched method on connection for ${method.name}`);
    }
  }

  private setChannelMax(maxChannel: number) {
    if (maxChannel > this.serverChannelMax && this.serverChannelMax !== 0) {
      return;
    }
    this.serverChannelMax = maxChannel;
  }

  private destroyStream() {
    this.reconnectable.disconnect();
    if (this.stream !== null) {
      this.stream.destroy();
    }

    if (this.disconnectTimer !== null) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    this.emit('close');
  }

  // handle heartbeat event
  private onHeartbeat() {
    if (this.incomingHearbeatTimer === null) {
      return;
    }

    // refresh incoming heartbeat timer
    if (typeof this.incomingHearbeatTimer.refresh === 'function') {
      this.incomingHearbeatTimer.refresh();
    } else {
      clearInterval(this.incomingHearbeatTimer);
      this.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2);
    }

    this.emit('heartbeat');
  }

  private onMissedHearbeat() {
    if (this.stream === null) {
      return;
    }

    this.stream.emit('error', new HeartbeatError('heartbeat failed'));
  }

  private send(data: Buffer, doNotRefresh?: boolean): boolean | null {
    if (this.stream === null) {
      return null;
    }

    // each send - refresh outgoing heartbeat timer
    if (doNotRefresh !== true && this.outgoingHeartbeatTimer !== null) {
      if (typeof this.outgoingHeartbeatTimer.refresh === 'function') {
        this.outgoingHeartbeatTimer.refresh();
      } else {
        clearInterval(this.outgoingHeartbeatTimer);
        this.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat);
      }
    }

    // send data
    return this.stream.write(data);
  }

  private sendHeartbeat() {
    return this.send(codec.HeartbeatFrame, true);
  }

  // event handlers
  private onConnect(stream: net.Socket | tls.TLSSocket) {
    this.stream = stream;
    this.stream.on('data', this.parser.execute);

    // and send handshake
    stream.write(codec.HandshakeFrame);

    // prepare heartbeats, do 2x time for interval
    this.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2);
    this.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat);
  }

  private onDisconnect() {
    if (this.stream !== null) {
      this.stream.removeListener('data', this.parser.execute);
      this.stream = null;
    }

    if (this.incomingHearbeatTimer !== null) {
      clearInterval(this.incomingHearbeatTimer);
      this.incomingHearbeatTimer = null;
    }

    if (this.outgoingHeartbeatTimer !== null) {
      clearInterval(this.outgoingHeartbeatTimer);
      this.outgoingHeartbeatTimer = null;
    }

    this.parser.reset();
  }

  private onReconnect(n: number) {
    // if it is 1st attempt to reconnect -> ignore trying to reach next machine
    if (n < 2) { return; }

    // update to new configuration options
    this.machineIndex = (this.machineIndex + 1) % this.config.hosts.length;
    const host = this.config.hosts[this.machineIndex];
    Object.assign(this.mutableConnectionOptions, host);
  }

  private onError(err: Error) {
    // TODO: do something better
    this.emit('error', err);
  }
}

export default Reconnectable;
