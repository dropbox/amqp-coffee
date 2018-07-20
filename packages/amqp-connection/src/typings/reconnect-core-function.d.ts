declare module 'reconnect-core' {
  import { EventEmitter } from 'events';
  import { Socket } from 'net';
  import { Duplex } from 'stream';
  import { TLSSocket } from 'tls';

  function RC(createConnection: RC.CreateConnection): RC.IInitiateConnection;

  namespace RC {
    interface IReconnectableConnection extends EventEmitter {
      connected: boolean;
      reconnect: boolean;
      _connection: Duplex;
      connect(...args: any[]): this;
      listen(...args: any[]): this;
      disconnect(): this;
      reset(): this;
    }

    interface IConfigurationOptions {
      // connection opts
      onConnect?: (this: IReconnectableConnection, stream: Socket | TLSSocket) => void;
      immediate?: boolean;

      // reconnection opts
      initialDelay?: number;
      maxDelay?: number;
      failAfter?: number;
      strategy?: string;
      randomisationFactor?: number;
      type?: string;
    }

    /* tslint:disable:unified-signatures max-line-length */
    interface IInitiateConnection {
      (opts: IConfigurationOptions, onConnect: IConfigurationOptions['onConnect']): IReconnectableConnection;
      (opts: IConfigurationOptions): IReconnectableConnection;
      (onConnect: IConfigurationOptions['onConnect']): IReconnectableConnection;
      (): IReconnectableConnection;
    }
    /* tslint:enable:unified-signatures max-line-length */

    type CreateConnection = (
      this: IReconnectableConnection,
      connectionOptions: any,
      socketOptions: any,
    ) => Duplex;
  }

  export = RC;
}
