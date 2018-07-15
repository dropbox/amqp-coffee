import AMQPParser, { HandshakeFrame } from '@microfleet/amqp-parser';
import eventToPromise = require('event-to-promise');
import { EventEmitter } from 'events';
import Joi = require('joi');
import net = require('net');
import RC = require('reconnect-core');
import tls = require('tls');
import netConnector from './connectors/net';
import tlsConnector from './connectors/tls';

export interface InterfaceAMQPConnectionConfiguration {
  hosts: Array<{ host: string, port: number }>;
  tls: boolean;
  tlsOptions: tls.TlsOptions;
  reconnect: boolean;
  reconnectOptions: RC.InterfaceConfigurationOptions;
  socketOptions: {
    keepAlive: boolean;
    noDelay: boolean;
    setTimeout: number;
  };
}

export interface InterfaceOptionalConfiguration {
  hosts: InterfaceAMQPConnectionConfiguration['hosts'];
  tls?: boolean;
  tlsOptions?: tls.TlsOptions;
  reconnect?: boolean;
  reconnectOptions?: RC.InterfaceConfigurationOptions;
  socketOptions?: InterfaceAMQPConnectionConfiguration['socketOptions'];
}

const connectionOptions = Joi
  .object({
    hosts: Joi.array()
      .items(Joi.object({
        host: Joi.string().required(),
        port: Joi.number().integer().required(),
      }))
      .required()
      .min(1),
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
      setTimeout: Joi.number().integer().default(20000),
    }).default(),
    tls: Joi.boolean().default(false),
    tlsOptions: Joi.object().unknown(true),
  })
  .default();

class Reconnectable extends EventEmitter {
  private config: InterfaceAMQPConnectionConfiguration;
  private connector: RC.InterfaceInitiateConnection;
  private reconnectable: RC.InterfaceReconnectableConnection;
  private stream: net.Socket | tls.TLSSocket | null = null;
  private machineIndex: number = 0;
  private mutableConnectionOptions: tls.TlsOptions | net.NetConnectOpts = {};
  private parser: AMQPParser;

  constructor(opts: InterfaceOptionalConfiguration) {
    super();
    this.config = Joi.attempt(opts, connectionOptions) as InterfaceAMQPConnectionConfiguration;
    this.parser = new AMQPParser({
      stringNumbers: true,
    });

    this.connector = this.config.tls ? tlsConnector : netConnector;
    this.reconnectable = this.connector(this.config.reconnectOptions);
    this.reconnectable.reconnect = this.config.reconnect;
    this.reconnectable.on('connect', this.onConnect.bind(this));
    this.reconnectable.on('reconnect', this.onReconnect.bind(this));
    this.reconnectable.on('disconnect', this.onDisconnect.bind(this));
    this.reconnectable.on('data', this.parser.execute);
    this.reconnectable.on('error', this.onError.bind(this));
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
    await eventToPromise(this.reconnectable, 'connect');
  }

  public async disconnect() {
    this.reconnectable.disconnect();
    await eventToPromise(this.reconnectable, 'disconnect');
  }

  // event handlers
  private onConnect(stream: net.Socket | tls.TLSSocket) {
    this.stream = stream;
    stream.write(HandshakeFrame);
  }

  private onDisconnect(err?: Error) {
    this.stream = null;
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
    // todo: handle errors
  }
}

export default Reconnectable;
