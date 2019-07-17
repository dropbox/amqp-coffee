// tslint:disable:object-literal-sort-keys

import * as codec from '@microfleet/amqp-codec';
import assert = require('assert');
import eventToPromise = require('event-to-promise');
import { EventEmitter } from 'events';
import net = require('net');
import rc = require('reconnect-core');
import tls = require('tls');
import {
  HeartbeatError,
  ServerCloseRequest,
  ServerErrorMismatch,
} from '../errors';
import netConnector from './tcp/net';
import tlsConnector from './tcp/tls';

export interface IConnectionConfig {
  host: string;
  port: number;
  heartbeat: number;
  tls: boolean;
  tlsOptions: tls.TlsOptions;
  reconnect: boolean;
  login: string;
  password: string;
  vhost: string;
  reconnectOptions: rc.ModuleOptions<tls.TLSSocket> | rc.ModuleOptions<net.Socket>;
  clientProperties: IClientProperties;
  socketOptions: {
    keepAlive?: boolean;
    noDelay?: boolean;
    setTimeout?: number;
  };
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

export type Timer = NodeJS.Timer | null;
export type Socket = net.Socket | tls.TLSSocket;

export const enum CONNECTION_STATUS {
  WAIT,
  AWAIT_RECONNECT,
  CONNECTING,
  TUNING,
  READY,
  CLOSING,
}

export class Connection extends EventEmitter {
  public id: string;
  public state: CONNECTION_STATUS;
  public serverChannelMax: number = 0;
  public serverProperties: IServerProperties = Object.create(null);

  private config: IConnectionConfig;
  private connector: typeof netConnector | typeof tlsConnector;
  private reconnectable: ReturnType<typeof netConnector> | ReturnType<typeof tlsConnector>;
  private parser: codec.Parser;
  private serializer: codec.Serializer;
  private connectionOptions: tls.TlsOptions | net.NetConnectOpts;
  private stream: Socket | null = null;
  private timers: { [name: string]: Timer } = Object.create(null);

  constructor(config: IConnectionConfig, serializer: codec.Serializer) {
    super();
    this.config = config;
    this.serializer = serializer;

    // host connection options
    this.connectionOptions = {
      ...this.config.tls && this.config.tlsOptions,
      host: this.config.host,
      port: this.config.port,
    };

    // node id
    this.id = `${this.config.host}:${this.config.port}`;
    this.state = CONNECTION_STATUS.WAIT;

    // bind functions
    this.onConnect = this.onConnect.bind(this);
    this.onMissedHearbeat = this.onMissedHearbeat.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
    this.handleResponse = this.handleResponse.bind(this);

    // underlaying (re)connection handling
    this.connector = this.config.tls ? tlsConnector : netConnector;
    this.reconnectable = this.connector(this.config.reconnectOptions as any);

    // @ts-ignore
    this.reconnectable.on('connect', this.onConnect);
    this.reconnectable.on('reconnect', this.onReconnect.bind(this));
    this.reconnectable.on('disconnect', this.onDisconnect.bind(this));
    this.reconnectable.on('error', this.onError.bind(this));

    // incoming data parser
    this.parser = new codec.Parser({ handleResponse: this.handleResponse });
  }

  // Public interface
  public async connect() {
    this.reconnectable.connect({
      opts: this.connectionOptions as any,
      socket: this.config.socketOptions,
    });

    await eventToPromise(this, 'ready', { error: 'closed' });
  }

  public async disconnect() {
    // graceful shutdown
    if (this.stream !== null) {
      // request graceful close
      if (this.state === CONNECTION_STATUS.READY) {
        this.stream.write(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionClose,
          args: { classId: 0, methodId: 0, replyCode: 200, replyText: 'closed' },
        }));
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

    if (this.timers.disconnectTimer === null) {
      const timeout = this.config.socketOptions.setTimeout || 2500;
      this.timers.disconnectTimer = setTimeout(this.destroyStream.bind(this), timeout);
    }

    // if not - wait for the promise
    await eventToPromise(this, 'closed');
  }

  public send(data: Buffer, doNotRefresh?: boolean): boolean | null {
    if (this.stream === null) {
      throw new Error('stream closed');
    }

    // each send - refresh outgoing heartbeat timer
    if (doNotRefresh !== true && this.timers.outgoingHeartbeatTimer !== null) {
      if (typeof this.timers.outgoingHeartbeatTimer.refresh === 'function') {
        this.timers.outgoingHeartbeatTimer.refresh();
      } else {
        clearInterval(this.timers.outgoingHeartbeatTimer);
        this.timers.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat);
      }
    }

    // send data
    return this.stream.write(data);
  }

  /**
   * Receives
   */
  private handleResponse(frameChannel: number, data: codec.ParsedResponse): void {
    if (data instanceof Error) {
      (this.stream as Socket).emit('error', data, frameChannel);
      return;
    }

    // any type of incoming data resets heartbeat timer
    this.onHeartbeat();

    // skip heartbeat frame - already processed
    if (data.type === codec.FrameType.HEARTBEAT) {
      return;
    }

    // channel can have header/body stuff, 0 is underlaying connection
    // and can only have method
    if (frameChannel > codec.ServiceChannel) {
      this.emit('command', frameChannel, data);
      return;
    }

    // ensure that we do not get some weird shit here
    assert.equal(data.type, codec.FrameType.METHOD, `invalid frame type for channel 0: ${data.type}`);
    const { method, args } = data as codec.IMethodFrame;

    switch (method) {
      case codec.Protocol.methods.connectionStart:
        if (args.versionMajor !== 0 && args.versionMinor !== 9) {
          this.reconnectable.reconnect = false;
          (this.stream as Socket).emit('error', new ServerErrorMismatch(args));
          return;
        }

        this.setState(CONNECTION_STATUS.TUNING);
        this.serverProperties = args.serverProperties;
        this.send(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionStartOk,
          args: {
            mechanism: 'AMQPLAIN',
            locale: 'en_US',
            clientProperties: this.config.clientProperties,
            response: { LOGIN: this.config.login, PASSWORD: this.config.password },
          },
        }));
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
        this.setState(CONNECTION_STATUS.READY);
        return;

      case codec.Protocol.methods.connectionClose:
        this.setState(CONNECTION_STATUS.CLOSING);
        this.send(this.serializer.encode(codec.ServiceChannel, {
          type: codec.FrameType.METHOD,
          method: codec.Protocol.methods.connectionCloseOk,
          args: {},
        }));

        const error = new ServerCloseRequest(args.replyText, args.replyCode);
        (this.stream as Socket).emit('error', error);
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

    if (this.timers.disconnectTimer !== null) {
      clearTimeout(this.timers.disconnectTimer);
      this.timers.disconnectTimer = null;
    }

    this.setState(CONNECTION_STATUS.WAIT);
  }

  // handle heartbeat event
  private onHeartbeat() {
    if (this.timers.incomingHearbeatTimer === null) {
      return;
    }

    // refresh incoming heartbeat timer
    if (typeof this.timers.incomingHearbeatTimer.refresh === 'function') {
      this.timers.incomingHearbeatTimer.refresh();
    } else {
      clearInterval(this.timers.incomingHearbeatTimer);
      this.timers.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2);
    }
  }

  private onMissedHearbeat() {
    if (this.stream === null) {
      return;
    }

    this.stream.emit('error', new HeartbeatError('heartbeat failed'));
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
    this.timers.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2);
    this.timers.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat);
  }

  private onDisconnect(err: Error | false) {
    if (this.stream !== null) {
      this.stream.removeListener('data', this.parser.execute);
      this.stream = null;
    }

    if (this.timers.incomingHearbeatTimer !== null) {
      clearInterval(this.timers.incomingHearbeatTimer);
      this.timers.incomingHearbeatTimer = null;
    }

    if (this.timers.outgoingHeartbeatTimer !== null) {
      clearInterval(this.timers.outgoingHeartbeatTimer);
      this.timers.outgoingHeartbeatTimer = null;
    }

    this.parser.reset();

    // in case err is `false` it means we've asked for a .disconnect() manually
    if (err !== false) {
      this.reconnectable.reconnect = this.config.reconnect;
    }

    if (this.reconnectable.reconnect === false) {
      this.setState(CONNECTION_STATUS.WAIT, err);
    } else {
      this.setState(CONNECTION_STATUS.AWAIT_RECONNECT);
    }
  }

  private onReconnect() {
    this.setState(CONNECTION_STATUS.CONNECTING);
  }

  private onError(err: Error) {
    this.emit('error', err);
  }

  private setState(state: CONNECTION_STATUS, err?: Error | false) {
    if (this.state === state) {
      return;
    }

    this.state = state;

    // special cases for which we emit new events
    switch (state) {
      case CONNECTION_STATUS.READY:
        this.emit('ready');
        break;

      case CONNECTION_STATUS.WAIT:
        this.emit('closed', err);
        break;
    }
  }
}

export default Connection;
