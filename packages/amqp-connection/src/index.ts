import { strict as assert } from 'assert'
import Joi = require('@hapi/joi');
import { EventEmitter, once } from 'events'
import os = require('os');
import readPkgUp = require('read-pkg-up');
import _debug = require('debug');
// import { Serializer } from '@microfleet/amqp-codec'
import { Connection, ConnectionConfig } from './connectors/connection'
import { StartupNodes, ConnectionPool } from './connectors/connectionPool'
import { shuffle } from './util'
import { AggregateError } from './errors'

const pkg = readPkgUp.sync({ cwd: __dirname })?.packageJson
assert(pkg, 'pkg must be defined')

const debug = _debug('amqp-connection:index')
type CPConfiguration = Omit<ConnectionConfig, 'host' | 'port'>;

// TODO: explain what each of the statuses mean
export const enum ClusterStatus {
  Wait = "WAIT",
  Connecting = "CONNECTING",
  Reconnecting = "RECONNECTING",
  Ready = "READY",
  Disconnecting = "DISCONNECTING",
  Close = "CLOSE",
}

const startupNodesSchema = Joi.array()
  .items(Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().required(),
  }))
  .required()
  .min(1)

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
  .default()

class Reconnectable extends EventEmitter {
  private readonly config: CPConfiguration;
  private readonly startupNodes: StartupNodes;
  private readonly connectionPool: ConnectionPool;
  // private readonly serializer: Serializer = new Serializer();
  private manuallyClosing = false
  private status = ClusterStatus.Wait
  private connecting: Promise<void> | null = null;
  private connection: Connection | null = null;
  private pendingConnections: Map<string, Connection> = new Map()

  constructor(nodes: StartupNodes, opts: Partial<CPConfiguration> = {}) {
    super()

    this.startupNodes = Joi.attempt(nodes, startupNodesSchema)
    this.config = Joi.attempt(opts, connectionOptions)
    this.connectionPool = new ConnectionPool(this.config)

    this.connectionPool.on('-node', (amqp: Connection, key: string) => {
      this.emit('-node', amqp)
      this.pendingConnections.delete(key)
    })

    this.connectionPool.on('+node', (amqp: Connection/*, key: string */) => {
      this.emit('+node', amqp)
    })

    this.connectionPool.on('drain', () => {
      if (!this.config.reconnect || this.manuallyClosing) {
        this.setStatus(ClusterStatus.Close)
      } else {
        this.setStatus(ClusterStatus.Reconnecting)
        this.connectionPool.reset(this.startupNodes)
      }
    })

    this.connectionPool.on('nodeError', (error: Error | undefined, amqp: Connection, key: string) => {
      debug('node error', key)

      this.emit('node error', error, amqp, key)
      this.pendingConnections.delete(key)

      if (this.connection === amqp) {
        this.setStatus(ClusterStatus.Reconnecting)
      }
    })

    this.connectionPool.on('nodeReady', (node: Connection, key: string) => {
      debug('+nodeReady', key)

      if (this.connection === null) {
        this.setStatus(ClusterStatus.Ready, node)
      } else {
        this.pendingConnections.set(key, node)
      }
    })
  }

  // Public interface
  public async connect(): Promise<void> {
    debug('initiating connect')

    // for cases where we are already connecting
    if (this.connecting) {
      return this.connecting
    }

    // when there is an active connection - do nothing
    if (this.connection) {
      return
    }

    // initiate connection sequence
    const connect = async (): Promise<void> => {
      // initialize nodes to connect to
      // TODO: use admin API to retrieve all nodes and enable sniffing for in-flight
      // reconfiguration
      this.connectionPool.reset(this.startupNodes)

      // to ensure random order of connecting
      const nodes = shuffle(this.connectionPool.getNodes())

      // ensure we have nodes to connect to
      assert(nodes.length > 0, 'no nodes to connect to')

      // alter status
      this.setStatus(ClusterStatus.Connecting)

      // iterate over all nodes
      let node: Connection | undefined
      const err = new AggregateError('connection error')
      while (this.status === ClusterStatus.Connecting && (node = nodes.pop())) {
        try {
          await node.connect()
          debug('connection established')
          return
        } catch (e) {
          debug('connection failed to node with error %O', e)
          err.addError(e)
        }
      }

      if (this.config.reconnect) {
        debug('reached end of life for nodes, restarting')
        return connect()
      }

      throw err
    }

    this.connecting = connect()

    try {
      await this.connecting
      debug('connected resolved')
    } finally {
      this.connecting = null
    }
  }

  // TODO: before closing the connection ensure we execute/reject all the outstanding commands
  public async disconnect(): Promise<void> {    
    debug('calling disconnect')
    this.manuallyClosing = true

    switch (this.status) {
      case ClusterStatus.Wait:
      case ClusterStatus.Close:
        return
      
      case ClusterStatus.Connecting:
      case ClusterStatus.Ready:
      case ClusterStatus.Reconnecting:
        this.setStatus(ClusterStatus.Disconnecting)
        this.connectionPool.reset([])
        break
    }

    await once(this, ClusterStatus.Close)
  }

  /**
   * Change cluster instance's status
   */
  private setStatus(status: ClusterStatus, node: Connection | null = null): void {
    debug("status: %s -> %s", this.status || "[empty]", status)
    this.status = status
    this.connection = node

    switch (status) {
      case ClusterStatus.Close:
        this.pendingConnections.clear()
        break

      case ClusterStatus.Reconnecting: {
        const { value, done } = this.pendingConnections.entries().next()
        if (!done && value) {
          const [key, connection] = value as [string, Connection]
          this.pendingConnections.delete(key)
          this.setStatus(ClusterStatus.Ready, connection)
        }
        break
      }
    }

    process.nextTick(() => {
      this.emit(status)
    })
  }
}

export default Reconnectable
