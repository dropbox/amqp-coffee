import { Serializer } from '@microfleet/amqp-codec';
import { EventEmitter } from 'events';
import Connection, { CONNECTION_STATUS, IAMQPConnectionConfiguration } from './connection';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export type ICPConfiguration = Omit<IAMQPConnectionConfiguration, 'host' | 'port'>;
export interface IStartupNode {
  host: string;
  port: number;
}
export type StartupNodes = IStartupNode[];

export const kConnections = Symbol('connections');
export const kErrors = Symbol('errors');
const getNodeKey = (node: StartupNodes[0]) => {
  return `${node.host}_${node.port}`;
};

/**
 * Get a random element from `array`
 *
 * @export
 * @template T
 * @param {T[]} array the array
 * @param {number} [from=0] start index
 * @returns {T}
 */
export function sample<T>(array: T[], from: number = 0): T {
  const length = array.length;
  if (from >= length) {
    throw new Error('out of range error');
  }

  return array[from + Math.floor(Math.random() * (length - from))];
}

export class ConnectionPool extends EventEmitter {
  private serializer = new Serializer();
  private specifiedOptions: { [key: string]: any } = Object.create(null);
  private [kErrors]: { [key: string]: Error } = Object.create(null);
  private [kConnections]: { [key: string]: Connection } = Object.create(null);

  constructor(private config: ICPConfiguration) {
    super();
  }

  public getNodes(): Connection[] {
    const nodes = this[kConnections];
    return Object.keys(nodes).map((key) => nodes[key]);
  }

  public getInstanceByKey(key: string): any {
    return this[kConnections][key];
  }

  public getSampleInstance(): Connection {
    const keys = Object.keys(this[kConnections]);
    const sampleKey = sample(keys);
    return this[kConnections][sampleKey];
  }

  public findOrCreate(node: IStartupNode): any {
    const key = getNodeKey(node);

    if (this.specifiedOptions[key]) {
      Object.assign(node, this.specifiedOptions[key]);
    } else {
      this.specifiedOptions[key] = node;
    }

    let amqp: Connection;
    if (this[kConnections][key]) {
      amqp = this[kConnections][key];
    } else {
      const opts = {
        host: node.host,
        port: node.port,
        ...this.config,
      };

      amqp = new Connection(opts, this.serializer);
      this[kConnections][key] = amqp;
    }

    amqp.once('closed', (error?: Error | false) => {
      delete this[kConnections][key];

      this.emit('-node', amqp, key, error);
      if (!Object.keys(this[kConnections]).length) {
        this.emit('drain');
      }

      amqp.removeAllListeners('ready');
    });

    this.emit('+node', amqp, key);

    amqp.on('error', (error) => {
      this.emit('nodeError', error, key);
    });

    return amqp;
  }

  /**
   * Reset the pool with a set of nodes.
   * The old node will be removed.
   */
  public reset(nodes: StartupNodes): void {
    this[kErrors] = Object.create(null);

    const newNodes: { [key: string]: IStartupNode } = Object.create(null);
    for (const node of nodes) {
      newNodes[getNodeKey(node)] = node;
    }

    for (const [key, node] of Object.entries(this[kConnections])) {
      if (!newNodes[key]) {
        node.disconnect();
      }
    }

    for (const node of Object.values(newNodes)) {
      this.findOrCreate(node);
    }
  }
}
