// tslint:disable:object-literal-sort-keys

import Joi = require('@hapi/joi');
import e2p = require('event-to-promise');
import { EventEmitter } from 'events';
import os = require('os');
import readPkgUp = require('read-pkg-up');
import { Serializer } from '@microfleet/amqp-codec';
import { Connection, IConnectionConfig } from './connectors/connection';
import { StartupNodes } from './connectors/connectionPool';
import { sample } from './util/sample';

const { pkg } = readPkgUp.sync({ cwd: __dirname });

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type ICPConfiguration = Omit<IConnectionConfig, 'host' | 'port'>;

const startupNodesSchema = Joi.array()
  .items(Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().required(),
  }))
  .required()
  .min(1);

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
    login: Joi.string().default('guest'),
    password: Joi.string().default('guest'),
    reconnect: Joi.boolean().default(true),
    reconnectOptions: Joi.object({
      failAfter: Joi.number().integer().default(10),
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

class Reconnectable extends EventEmitter {
  private readonly config: ICPConfiguration;
  private readonly startupNodes: StartupNodes;
  private readonly connections: Connection[];
  private readonly serializer: Serializer = new Serializer();

  private activeConnection: Connection | null = null;

  constructor(startupNodes: StartupNodes, opts: Partial<ICPConfiguration> = {}) {
    super();

    this.startupNodes = Joi.attempt(startupNodes, startupNodesSchema) as StartupNodes;
    this.config = Joi.attempt(opts, connectionOptions) as ICPConfiguration;
    this.connections = startupNodes.map((node) => {
      const nodeSettings = { ...this.config, ...node };
      return new Connection(nodeSettings, this.serializer);
    });
  }

  // Public interface
  public async connect(): Promise<void> {
    if (this.activeConnection !== null) {
      throw new Error('already connected');
    }

    await connectUntilExhausted();
  }

  // TODO: finish/reject queued up commands
  public async disconnect(): Promise<void> {

  }

  private async connectUntilExhausted() {
    const connection = sample(this.connections);
    this.activeConnection = connection;

    await connection.connect();
  }
}

export default Reconnectable;
