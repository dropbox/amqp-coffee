import { EventEmitter } from 'events'
import * as net from 'net'
import * as tls from 'tls'
import Joi = require('joi')
import { CONNECTION_STATE, HeartbeatFrame } from './constants'
import { connection as connectionSchema } from './defaults'
const debug = require('debug').debug('amqp:Connection')

export interface ClientProperties {
  version: string,
  platform: string,
  product: string,
  capabilities: {
    [capability: string]: boolean,
  }
}

export interface ConnectionConfig {
  host: Array<string | { host: string, port: number }>,
  hosts: Array<{ host: string, port: number }>,
  hosti?: number,
  port: number,
  login: string,
  password: string,
  vhost: string,
  ssl: number,
  sslPort: number,
  sslOptions?: tls.TlsOptions,
  heartbeat: number,
  reconnect: boolean,
  reconnectDelayTime: number,
  hostRandom: boolean,
  connectTimeout: number,
  channelMax: number,
  keepAlive: any,
  frameMax: number,
  noDelay: boolean,
  temporaryChannelTimeout: number,
  temporaryChannelTimeoutCheck: number,
  clientProperties: ClientProperties,
}

export default class Connection extends EventEmitter {
  private id: number;
  private connectionOptions: ConnectionConfig;
  private channelCount: number;
  private state: symbol;
  private stream: tls.TLSSocket | net.Socket;
  private sendHeartbeatTimer: NodeJS.Timer & { refresh?(): void };
  private heartbeatTimer: NodeJS.Timer & { refresh?(): void };

  // public data
  host: string;
  port: number;

  constructor(options: any = {}) {
    super()
    this.id = Math.round(Math.random() * 1000)
    this.channelCount = 0
    this.state = CONNECTION_STATE.closed

    // prepare connection settings
    this.connectionOptions = Joi.attempt(options, connectionSchema)
    this.normalizeHosts()
  }

  public async connect() {
    if (this.state !== CONNECTION_STATE.closed) {
      throw new Error(`connection state: ${this.state.toString()}`)
    }

    const { stream, connectionEvent } = this.prepareStream()
    this.stream = stream;
    this.state = CONNECTION_STATE.opening

    if (this.connectionOptions.connectTimeout) {
      stream.setTimeout(this.connectionOptions.connectTimeout, () => {
        stream.setTimeout(0);
        stream.destroy();

        // const err = new Error('connect ETIMEDOUT');
        // err.errorno = 'ETIMEDOUT';
        // err.code = 'ETIMEDOUT';
        // err.syscall = 'connect';
        // eventHandler.errorHandler(_this)(err);
        throw new Error('connect ETIMEDOUT');
      });

      stream.once(connectionEvent, () => stream.setTimeout(0));
    }

    stream.on(connectionEvent, this.connected.bind(this))
    stream.on('error', this.connectionErrorEvent.bind(this))
    stream.on('close', this.connectionClosedEvent.bind(this));
  }

  private connected() {
    this.resetAllHeartbeatTimers()
    // this.setupParser(this.reestablishChannels)
  }

  private connectionErrorEvent(err: Error) {
    if @state isnt 'destroyed'
      debug 1, () => return ["Connection Error ", e, r, @connectionOptions.host]

    // if we are to keep trying we wont callback until we're successful, or we've hit a timeout.
    if !@connectionOptions.reconnect
      if @cb?
        @cb(e,r)
      else
        @emit 'error', e
  }

  private resetAllHeartbeatTimers() {
    this.resetSendHeartbeatTimer()
    this.resetHeartbeatTimer()
  }

  private resetSendHeartbeatTimer() {
    if (this.sendHeartbeatTimer && 'refresh' in this.sendHeartbeatTimer) {
      this.sendHeartbeatTimer.refresh()
    } else {
      clearInterval(this.sendHeartbeatTimer)
      this.sendHeartbeatTimer = global.setInterval(this.sendHeartbeat.bind(this), this.connectionOptions.heartbeat)
    }
  }

  private resetHeartbeatTimer() {
    if (this.heartbeatTimer && 'refresh' in this.heartbeatTimer) {
        this.heartbeatTimer.refresh()
    } else {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = global.setInterval(this.missedHeartbeat.bind(this), this.connectionOptions.heartbeat * 2)
    }
  }

  private missedHeartbeat() {
    if (this.state === CONNECTION_STATE.open) {
      debug('We missed a heartbeat, destroying the connection.')
      this.stream.destroy()
    }

    this.clearHeartbeatTimer()
  }

  private clearHeartbeatTimer() {
    debug('_clearHeartbeatTimer')
    clearInterval(this.heartbeatTimer)
    clearInterval(this.sendHeartbeatTimer)
    this.heartbeatTimer = null
    this.sendHeartbeatTimer = null
  }

  private sendHeartbeat() {
    this.stream.write(HeartbeatFrame)
  }

  private normalizeHosts(): void {
    const settings = this.connectionOptions
    settings.hosts = settings.host.map((uri) => {
      if (typeof uri === 'object') {
        return uri
      }

      if (uri.includes(':')) {
        const [host, port] = uri;
        return { host: host.toLowerCase(), port: parseInt(port, 10) }
      }

      return {
        host: uri.toLowerCase(),
        port: settings.ssl ? settings.sslPort : settings.port,
      }
    })

    // seed initial host
    settings.hosti = settings.hostRandom
      ? Math.floor(Math.random() * settings.hosts.length)
      : -1;

    // select next available host
    this.nextConnectionHost()
  }

  private nextConnectionHost(): void {
    const settings = this.connectionOptions
    const { hosts } = settings

    // select next available host
    settings.hosti = (settings.hosti + 1) % hosts.length

    // set current settings for connection
    this.host = hosts[settings.hosti].host
    this.port = hosts[settings.hosti].port
  }

  private prepareStream(): { stream: tls.TLSSocket | net.Socket, connectionEvent: string } {
    // prepare connection options
    const settings = this.connectionOptions;

    let stream;
    let connectionEvent = 'connect';
    const socketOptions = { host: this.host, port: this.port };

    if (this.connectionOptions.ssl) {
      connectionEvent = 'secureConnect';
      Object.assign(socketOptions, settings.sslOptions);
      stream = tls.connect(socketOptions)
    } else {
      stream = net.connect(socketOptions)
    }

    if (typeof settings.keepAlive === 'number') {
      stream.setKeepAlive(true, settings.keepAlive);
    }

    if (settings.noDelay) {
      stream.setNoDelay(true);
    }

    return { stream, connectionEvent }
  }
}
