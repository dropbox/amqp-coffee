declare module 'reconnect-core' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';

  function RC(createConnection: RC.CreateConnection): RC.InterfaceInitiateConnection;

  namespace RC {
    interface InterfaceReconnectableConnection extends EventEmitter {
      connected: boolean;
      reconnect: boolean;
      _connection: Duplex;
      connect(...args: any[]): this;
      listen(...args: any[]): this;
      disconnect(): this;
      reset(): this;
    }

    interface InterfaceConfigurationOptions {
      // connection opts
      onConnect?: (this: InterfaceReconnectableConnection) => void;
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
    interface InterfaceInitiateConnection {
      (opts: InterfaceConfigurationOptions, onConnect: InterfaceConfigurationOptions['onConnect']): InterfaceReconnectableConnection;
      (opts: InterfaceConfigurationOptions): InterfaceReconnectableConnection;
      (onConnect: InterfaceConfigurationOptions['onConnect']): InterfaceReconnectableConnection;
      (): InterfaceReconnectableConnection;
    }
    /* tslint:enable:unified-signatures max-line-length */

    type CreateConnection = (
      this: InterfaceReconnectableConnection,
      connectionOptions: any,
      socketOptions: any,
    ) => Duplex;
  }

  export = RC;
}
