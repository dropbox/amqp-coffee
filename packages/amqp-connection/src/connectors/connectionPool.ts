import { Serializer } from '@microfleet/amqp-codec'
import { EventEmitter } from 'events'
import { sample } from '../util'
import _debug = require('debug')
import Connection, { ConnectionConfig } from './connection'

const debug = _debug('amqp-connection:pool')

export type CPConfiguration = Omit<ConnectionConfig, 'host' | 'port'>;
export interface StartupNode {
  host: string;
  port: number;
}
export type StartupNodes = StartupNode[];

export const kConnections = Symbol('connections')
export const kErrors = Symbol('errors')
const getNodeKey = (node: StartupNode) => {
  return `${node.host}_${node.port}`
}

export class ConnectionPool extends EventEmitter {
  private serializer = new Serializer();
  private specifiedOptions: Record<string, any> = Object.create(null);
  private [kConnections]: Record<string, Connection> = Object.create(null);
  
  // when connection pool is drained
  public drained = true

  constructor(private config: CPConfiguration) {
    super()
    debug('initiated pool with %j', config)
  }

  public getNodes(): Connection[] {
    const nodes = this[kConnections]
    return Object.values(nodes)
  }

  public getInstanceByKey(key: string): Connection | void {
    return this[kConnections][key]
  }

  public getSampleInstance(): Connection {
    const keys = Object.keys(this[kConnections])
    const sampleKey = sample(keys)
    return this[kConnections][sampleKey]
  }

  public findOrCreate(node: StartupNode): Connection {
    const key = getNodeKey(node)

    if (this.specifiedOptions[key]) {
      Object.assign(node, this.specifiedOptions[key])
    } else {
      this.specifiedOptions[key] = node
    }

    let amqp: Connection
    if (this[kConnections][key]) {
      amqp = this[kConnections][key]
    } else {
      const opts = {
        ...this.config,
        host: node.host,
        port: node.port,
      }

      amqp = new Connection(opts, this.serializer)
      this[kConnections][key] = amqp
      this.drained = false
    }

    amqp.once('closed', (error?: Error | false) => {
      delete this[kConnections][key]

      debug('-node %s: %O', key, error)
      
      this.emit('-node', amqp, key, error)
      if (!Object.keys(this[kConnections]).length) {
        this.drained = true
        debug('drain')
        this.emit('drain')
      }

      amqp.removeAllListeners('ready')
    })

    this.emit('+node', amqp, key)
    debug('+node', key)

    amqp.on('reconnecting', (error?: Error) => {
      this.emit('nodeError', error, amqp, key)
    })

    amqp.on('error', (error) => {
      this.emit('nodeError', error, amqp, key)
    })

    amqp.on('ready', () => {
      this.emit('nodeReady', amqp, key)
    })

    return amqp
  }

  /**
   * Reset the pool with a set of nodes.
   * The old node will be removed.
   */
  public reset(nodes: StartupNodes): void {
    const newNodes: Record<string, StartupNode> = Object.create(null)
    for (const node of nodes) {
      newNodes[getNodeKey(node)] = node
    }

    for (const [key, node] of Object.entries(this[kConnections])) {
      if (!newNodes[key]) {
        node.disconnect()
      }
    }

    for (const node of Object.values(newNodes)) {
      this.findOrCreate(node)
    }
  }
}
