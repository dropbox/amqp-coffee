
import assert = require('assert');
import { EventEmitter, once } from 'events'
import net = require('net');
import rc = require('reconnect-core');
import tls = require('tls');
import { 
  MethodFrame, 
  Content,
  FrameType, 
  methods, 
  Parser, 
  Serializer, 
  ServiceChannel, 
  ParsedResponse, 
  HeartbeatFrame,
  HandshakeFrame,
  MethodFrameConnectionStart, 
  MethodFrameConnectionTune,
  MethodFrameConnectionClose,
  MethodNames, ContentHeader
} from '@microfleet/amqp-codec'
import {
  HeartbeatError,
  ServerCloseRequest,
  ServerErrorMismatch,
} from '../errors'
import netConnector from './tcp/net'
import tlsConnector from './tcp/tls'
import _debug = require('debug')

const debug = _debug('amqp-connection:connection')

export interface ConnectionConfig {
  host: string;
  port: number;
  heartbeat: number;
  tls: boolean;
  tlsOptions: tls.TlsOptions;
  reconnect: boolean;
  login: string;
  password: string;
  vhost: string;
  reconnectOptions: rc.ModuleOptions<tls.TLSSocket | net.Socket>;
  clientProperties: ClientProperties;
  socketOptions: {
    keepAlive?: boolean;
    noDelay?: boolean;
    setTimeout?: number;
  };
  temporaryChannelTimeout: number;
  temporaryChannelTimeoutCheck: number;
}

export interface ClientProperties {
  version: string;
  platform: string;
  product: string;
  capabilities: {
    [capability: string]: boolean;
  };
}

export interface ServerProperties {
  product?: string;
  version?: string;
  capabitilies?: {
    [capability: string]: boolean;
  };
}

export type Timer = NodeJS.Timer | null;
export type Socket = net.Socket | tls.TLSSocket;

export const enum CONNECTION_STATUS {
  WAIT = "WAIT",
  AWAIT_RECONNECT = "AWAIT_RECONNECT",
  CONNECTING = "CONNECTING",
  TUNING = "TUNING",
  READY = "READY",
  CLOSING = "CLOSING",
}

const kCloseFrame: MethodFrame = {
  type: FrameType.METHOD,
  name: methods.connectionClose.name,
  method: methods.connectionClose,
  args: { classId: 0, methodId: 0, replyCode: 200, replyText: 'closed' },
}

export class Connection extends EventEmitter {
  public id: string;
  public state: CONNECTION_STATUS;
  public serverChannelMax = 0;
  public serverProperties: ServerProperties = Object.create(null);

  private config: ConnectionConfig;
  private connector: typeof netConnector | typeof tlsConnector;
  private reconnectable: ReturnType<typeof netConnector | typeof tlsConnector>;
  private parser: Parser;
  private serializer: Serializer;
  private connectionOptions: tls.TlsOptions | net.NetConnectOpts;
  private stream: Socket | null = null;
  private timers: { [name: string]: Timer } = Object.create(null);

  constructor(config: ConnectionConfig, serializer: Serializer) {
    super()
    this.config = config
    this.serializer = serializer

    // host connection options
    this.connectionOptions = {
      ...this.config.tls && this.config.tlsOptions,
      host: this.config.host,
      port: this.config.port,
    }

    // node id
    this.id = `${this.config.host}:${this.config.port}`
    this.state = CONNECTION_STATUS.WAIT

    // bind functions
    this.onConnect = this.onConnect.bind(this)
    this.onMissedHearbeat = this.onMissedHearbeat.bind(this)
    this.sendHeartbeat = this.sendHeartbeat.bind(this)
    this.handleResponse = this.handleResponse.bind(this)
    this.emitClosedError = this.emitClosedError.bind(this)

    // underlaying (re)connection handling
    this.connector = this.config.tls ? tlsConnector : netConnector
    this.reconnectable = this.connector(this.config.reconnectOptions, this.onConnect)
    this.reconnectable.on('reconnect', this.onReconnect.bind(this))
    this.reconnectable.on('disconnect', this.onDisconnect.bind(this))
    this.reconnectable.on('error', this.onError.bind(this))

    // incoming data parser
    this.parser = new Parser({ handleResponse: this.handleResponse })
  }

  private emitClosedError() {
    this.emit('error', new Error('closed'))
  }

  // Public interface
  public async connect(waitForConnect = true): Promise<void> {
    this.reconnectable.connect({
      opts: this.connectionOptions as any,
      socket: this.config.socketOptions,
    })

    if (waitForConnect) {
      await once(this, 'ready')
    }
  }

  public async disconnect(): Promise<void> {
    // graceful shutdown
    if (this.stream !== null) {
      // request graceful close
      if (this.state === CONNECTION_STATUS.READY) {
        this.stream.write(this.serializer.encode(ServiceChannel, kCloseFrame))
      } else {
        this.reconnectable.disconnect()
      }
    }

    // mark as to not reconnect
    this.reconnectable.reconnect = false

    // if we are already disconnected - we are already done
    if (this.reconnectable.connected === false) {
      debug('not connected, closing')
      
      // so that we reliably tell that we are done
      if (this.state === CONNECTION_STATUS.WAIT) {
        this.emit('closed')
      }

      return
    }

    if (this.timers.disconnectTimer === null) {
      const timeout = this.config.socketOptions.setTimeout || 2500
      this.timers.disconnectTimer = setTimeout(this.destroyStream.bind(this), timeout)
    }

    // if not - wait for the promise
    await once(this, 'closed')
  }

  public sendMethod(channel: number, data: MethodFrame): boolean | null {
    return this.send(this.serializer.encode(channel, data))
  }

  public sendData(channel: number, body: Content, header: Omit<ContentHeader, 'size'>): void {
    this.send(this.serializer.encode(channel, { ...header, size: body.data.length }))
    for (const frame of this.serializer.encode(channel, body)) {
      this.send(frame)
    }
  }

  private send(data: Buffer, doNotRefresh?: boolean): boolean | null {
    if (this.stream === null) {
      throw new Error('stream closed')
    }

    // each send - refresh outgoing heartbeat timer
    if (doNotRefresh !== true && this.timers.outgoingHeartbeatTimer !== null) {
      if (typeof this.timers.outgoingHeartbeatTimer.refresh === 'function') {
        this.timers.outgoingHeartbeatTimer.refresh()
      } else {
        clearInterval(this.timers.outgoingHeartbeatTimer)
        this.timers.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat)
      }
    }

    // send data
    return this.stream.write(data)
  }

  private handleConnectionStartMethod({ args }: MethodFrameConnectionStart): void {
    if (args.versionMajor !== 0 && args.versionMinor !== 9) {
      this.reconnectable.reconnect = false
      this.stream?.emit('error', new ServerErrorMismatch(args))
      return
    }

    this.setState(CONNECTION_STATUS.TUNING)
    this.serverProperties = args.serverProperties
    this.sendMethod(ServiceChannel, {
      type: FrameType.METHOD,
      name: MethodNames.connectionStartOk,
      method: methods.connectionStartOk,
      args: {
        mechanism: 'AMQPLAIN',
        locale: 'en_US',
        clientProperties: this.config.clientProperties,
        response: { LOGIN: this.config.login, PASSWORD: this.config.password },
      }
    })
  }

  private handleConnectionTune({ args }: MethodFrameConnectionTune): void {
    if (typeof args.channelMax === 'number') {
      this.setChannelMax(args.channelMax)
    }

    if (typeof args.frameMax === 'number') {
      this.serializer.setMaxFrameSize(args.frameMax)
    }

    this.sendMethod(ServiceChannel, {
      type: FrameType.METHOD,
      name: MethodNames.connectionTuneOk,
      method: methods.connectionTuneOk,
      args: {
        channelMax: this.serverChannelMax,
        frameMax: this.serializer.maxFrameSize,
        heartbeat: this.config.heartbeat / 1000,
      }
    })

    this.sendMethod(ServiceChannel, {
      type: FrameType.METHOD,
      method: methods.connectionOpen,
      name: MethodNames.connectionOpen,
      args: {
        virtualHost: this.config.vhost,
      }
    })
  }

  private handleConnectionClose({ args }: MethodFrameConnectionClose): void {
    this.setState(CONNECTION_STATUS.CLOSING)
    this.sendMethod(ServiceChannel, {
      type: FrameType.METHOD,
      name: MethodNames.connectionCloseOk,
      method: methods.connectionCloseOk
    })
    this.stream?.emit('error', new ServerCloseRequest(args.replyText, args.replyCode))
  }

  /**
   * Receives
   */
  private handleResponse(frameChannel: number, data: ParsedResponse): void {
    if (data instanceof Error) {
      this.stream?.emit('error', data, frameChannel)
      return
    }

    // any type of incoming data resets heartbeat timer
    this.onHeartbeat()

    // skip heartbeat frame - already processed
    if (data.type === FrameType.HEARTBEAT) {
      return
    }

    // channel can have header/body stuff, 0 is underlaying connection
    // and can only have method
    if (frameChannel > ServiceChannel) {
      this.emit('command', frameChannel, data)
      return
    }

    // ensure that we do not get some weird shit here
    assert(data.type === FrameType.METHOD, `invalid frame type for channel 0: ${data.type}`)

    switch (data.name) {
      case MethodNames.connectionStart: return this.handleConnectionStartMethod(data)
      case MethodNames.connectionTune: return this.handleConnectionTune(data)
      case MethodNames.connectionOpenOk: return this.setState(CONNECTION_STATUS.READY)
      case MethodNames.connectionClose: return this.handleConnectionClose(data)
      case MethodNames.connectionCloseOk: return this.destroyStream()
      default:
        throw new Error(`no matched method on connection for ${data.name}`)
    }
  }

  private setChannelMax(maxChannel: number) {
    if (maxChannel > this.serverChannelMax && this.serverChannelMax !== 0) {
      return
    }
    this.serverChannelMax = maxChannel
  }

  private destroyStream() {
    this.reconnectable.disconnect()
    if (this.stream !== null) {
      this.stream.destroy()
    }

    if (this.timers.disconnectTimer !== null) {
      clearTimeout(this.timers.disconnectTimer)
      this.timers.disconnectTimer = null
    }

    this.setState(CONNECTION_STATUS.WAIT)
  }

  // handle heartbeat event
  private onHeartbeat() {
    if (this.timers.incomingHearbeatTimer === null) {
      return
    }

    // refresh incoming heartbeat timer
    if (typeof this.timers.incomingHearbeatTimer.refresh === 'function') {
      this.timers.incomingHearbeatTimer.refresh()
    } else {
      clearInterval(this.timers.incomingHearbeatTimer)
      this.timers.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2)
    }
  }

  private onMissedHearbeat() {
    if (this.stream === null) {
      debug('missed heartbeat, but no stream established')
      return
    }

    debug('heartbeat failed')
    this.stream.emit('error', new HeartbeatError('heartbeat failed'))
  }

  private sendHeartbeat() {
    debug('send heartbeat')

    return this.send(HeartbeatFrame, true)
  }

  // event handlers
  private onConnect(stream: Socket) {
    this.stream = stream
    this.stream.on('data', this.parser.execute)

    // and send handshake
    stream.write(HandshakeFrame)

    // prepare heartbeats, do 2x time for interval
    this.timers.incomingHearbeatTimer = setInterval(this.onMissedHearbeat, this.config.heartbeat * 2)
    this.timers.outgoingHeartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeat)

    debug('connected, scheduled timers')
  }

  private onDisconnect(err: Error | false) {
    debug('received disconnect event', err)

    if (this.stream !== null) {
      this.stream.removeListener('data', this.parser.execute)
      this.stream = null
    }

    if (this.timers.incomingHearbeatTimer !== null) {
      clearInterval(this.timers.incomingHearbeatTimer)
      this.timers.incomingHearbeatTimer = null
    }

    if (this.timers.outgoingHeartbeatTimer !== null) {
      clearInterval(this.timers.outgoingHeartbeatTimer)
      this.timers.outgoingHeartbeatTimer = null
    }

    this.parser.reset()

    // in case err is `false` it means we've asked for a .disconnect() manually
    if (err !== false) {
      this.reconnectable.reconnect = this.config.reconnect
    }

    if (this.reconnectable.reconnect === false) {
      this.setState(CONNECTION_STATUS.WAIT, err)
    } else {
      this.setState(CONNECTION_STATUS.AWAIT_RECONNECT, err)
    }
  }

  private onReconnect() {
    this.setState(CONNECTION_STATUS.CONNECTING)
  }

  private onError(err: Error) {
    debug('received error event', err)

    if (this.listenerCount('error') > 0) {
      this.emit('error', err)
    }
  }

  private setState(state: CONNECTION_STATUS, err?: Error | false) {
    debug("status: %s -> %s", this.state || "[empty]", state)

    if (this.state === state) {
      return
    }

    this.state = state

    // special cases for which we emit new events
    switch (state) {
      case CONNECTION_STATUS.READY:
        this.emit('ready')
        break

      case CONNECTION_STATUS.AWAIT_RECONNECT:
        this.emit('reconnecting', err)
        break

      case CONNECTION_STATUS.WAIT:
        this.emit('closed', err)
        break
    }
  }
}

export default Connection
