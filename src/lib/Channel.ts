/**
 * Contains implementation of an AMQP channel
 */

import { EventEmitter } from 'events'
const debug = require('debug')('amqp:Channel')
import async = require('async')
import defer = require('lodash.defer')
import { protocol } from './config'
import { CHANNEL_STATE, CONNECTION_STATE } from './constants'

const { methodTable, classes, methods } = protocol

// we track this to avoid node's max stack size with a saturated async queue
let OVERFLOW_PROTECTION = 0
const noop = () => {};
const MS_PER_SEC = 1e3;
const NS_TO_MS = 1e6;
const timeToMS = (arr) => arr[0] * MS_PER_SEC + arr[1] / NS_TO_MS

export default class Channel extends EventEmitter {
  channel: number;
  connection: any;
  state: symbol;
  transactional: boolean;

  private channelTracker: NodeJS.Timer;
  private waitingCallbacks: Map<string, any>;
  private lastChannelAccess: [number, number];
  private temporaryChannelTimeoutCheck: number;
  private temporaryChannelTimeout: number;

  constructor(connection: any, channel: number) {
    super()
    this.channel = channel
    this.connection = connection
    this.state = CHANNEL_STATE.closed
    this.waitingCallbacks = new Map() // channel operations
    this.queue = async.queue(this._taskWorker, 1)
    this.temporaryChannelTimeoutCheck = this.connection.connectionOptions.temporaryChannelTimeoutCheck
    this.temporaryChannelTimeout = this.connection.connectionOptions.temporaryChannelTimeoutCheck

    this.open()
    this.transactional = false
  }

  temporaryChannel() {
    this.transactional = true // THIS IS NOT AMQP TRANSACTIONS
    this.lastChannelAccess = process.hrtime()

    if (process.env.AMQP_TEST) {
      this.connection.connectionOptions.temporaryChannelTimeout = 200
      this.connection.connectionOptions.temporaryChannelTimeoutCheck = 100
    }

    if (this.channelTracker == null) {
      this.channelTracker = global.setInterval(this.trackActivity.bind(this), this.temporaryChannelTimeoutCheck)
    }
  }

  compare

  trackActivity() {
    if (this.isAccessedBeforeTimeout() === true) {
      debug('Closing channel due to inactivity')
      this.close(true)
    }
  }

  isAccessedBeforeTimeout(): boolean {
    return timeToMS(process.hrtime(this.lastChannelAccess)) < this.temporaryChannelTimeout;
  }

  async open(waitForMethod = false) {
    if (this.state !== CHANNEL_STATE.closed) {
      return Promise.reject(new Error('state isn\'t closed. not opening channel'))
    }

    this.state = CHANNEL_STATE.opening
    if (waitForMethod) {
      this.waitForMethod(methods.channelOpenOk)
    }

    this.connection._sendMethod(this.channel, methods.channelOpen, {})
    this.connection.channelCount++

    if (this.transactional) {
      this.temporaryChannel()
    }
  }

  async reset() {
    if (this.state !== CHANNEL_STATE.open) {
      this._callOutstandingCallbacks(new Error('Channel Opening or Reseting'))
    }

    // if our state is closed and either we arn't a transactional channel (queue, exchange declare etc..)
    // or we're within our acceptable time window for this queue
    if (this.state !== CHANNEL_STATE.closed) return
    if (this.transactional === false) return this.reopen()
    if (this.listeners('open').length > 0) return this.reopen()
    if (this.transactional === true && this.isAccessedBeforeTimeout()) return this.reopen()
  }

  async reopen() {
    await this.open()
    await this._onChannelReconnect()
  }

  async crash() {
    if (!process.env.AMQP_TEST) {
      return true
    }

    // this will crash a channel forcing a channelOpen from the server
    // this is really only for testing
    debug('Trying to crash channel')
    this.connection._sendMethod(this.channel, methods.queuePurge, { queue: 'idontexist' })
    return this.waitForMethod(methods.channelClose)
  }

  async close(auto) {
    if (auto == null || !auto) {
      debug('User requested channel close')
    }

    clearInterval(this.channelTracker)
    this.channelTracker = null

    if (this.state !== CHANNEL_STATE.open) return

    this.connection.channelCount--
    this.state = CHANNEL_STATE.closed
    return this.connection._sendMethod(this.channel, methods.channelClose, {
      replyText: 'Goodbye',
      replyCode: 200,
      classId: 0,
      methodId: 0,
    })
  }

  async waitForMethod(method) {
    if (this.waitingCallbacks.has(method.name) === false) {
      this.waitingCallbacks.set(method.name, [])
    }

    return new Promise((resolve, reject) => {
      this.waitingCallbacks.get(method.name).push([resolve, reject])
    });
  }

  callbackForMethod(method) {
    if (method == null || this.waitingCallbacks.has(method.name) === false) {
      return noop;
    }

    const callbacks = this.waitingCallbacks.get(method.name);
    const promiseLike = callbacks.shift();
    if (callbacks.length === 0) {
      this.waitingCallbacks.delete(method.name);
    }

    return promiseLike;
  }

  // Functions to overwrite
  _channelOpen() {
    throw new Error('channel open called and should be overwritten')
  }

  _channelClosed() {
    throw new Error('channel closed called and should be overwritten')
  }

  async _onChannelReconnect() {
    throw new Error('channel reconnect called and should be overwritten')
  }

  _onMethod(method: string, args: any[]) {
    throw new Error('_onMethod MUST be overwritten by whoever extends Channel')
  }

  // TASK QUEUEING ---------------------------------------------------------
  taskPush(method, args, okMethod, cb) { // same as queueSendMethod
    this.queue.push({ type: 'method', method, args, okMethod, cb })
  }

  taskPushPreflight(method, args, okMethod, preflight, cb) {
    this.queue.push({ type: 'method', method, args, okMethod, preflight, cb })
  }

  taskQueuePushRaw(task, cb) {
    if (cb != null && task != null) task.cb = cb
    this.queue.push(task)
  }

  queueSendMethod(method, args, okMethod, cb) {
    this.queue.push({ type: 'method', method, args, okMethod, cb })
  }

  queuePublish(method, data, options) {
    this.queue.push({ type: 'publish', method, data, options })
  }

  async _taskWorker(task, done) {
    if (this.transactional) this.lastChannelAccess = process.hrtime()
    const { type, method, okMethod, args, cb, data, options, preflight } = task
    const doneFn = (err?: Error, res?: any) => {
      if (cb != null) cb(err, res)
      if (OVERFLOW_PROTECTION > 100) {
        OVERFLOW_PROTECTION = 0
        defer(done)
      } else {
        OVERFLOW_PROTECTION++
        done()
      }
    }

    // if preflight is false do not proceed
    if (preflight != null && !preflight()) {
      return doneFn(new Error('preflight check failed'))
    }

    if (this.state === CHANNEL_STATE.closed && this.connection.state === CONNECTION_STATE.open) {
      debug('Channel reassign')
      this.connection.channelManager.channelReassign(this)
      await this.open()
      return this._taskWorker(task, done)
    }

    if (this.state !== CHANNEL_STATE.open) {
      // if our connection is closed that ok, but if its destroyed it will not reopen
      if (this.connection.state === CONNECTION_STATE.destroyed) {
        return doneFn(new Error('Connection is destroyed'))
      }

      if (this.connection.channelManager.isChannelClosed(this.channel)) {
        this.connection.channelManager.channelReassign(this)
      }

      this.once('open', () => {
        this._taskWorker(task, done)
      })

      return
    }

    if (okMethod != null) {
      try {
        doneFn(null, await this.waitForMethod(okMethod))
      } catch (e) {
        doneFn(e)
      }
    }

    if (type === 'method') {
      @connection._sendMethod(@channel, method, args)
      doneFn() if !okMethod?
    }

    else if type is 'publish'
      @connection._sendMethod(@channel, method, options)
      @connection._sendBody @channel, data, options, (err, res)->
      doneFn() if !okMethod?

    else
      throw new Error("a task was queue with an unknown type of #{type}")


  _callOutstandingCallbacks: (message)=>
    outStandingCallbacks = @waitingCallbacks
    @waitingCallbacks    = {}

    if !message? then message = "Channel Unavaliable"
    for key, cbs of outStandingCallbacks
      for cb in cbs
        cb?(message)


  # incomming channel messages for us
  _onChannelMethod: (channel, method, args)->
    if @transactional then @lastChannelAccess = Date.now()

    if channel isnt @channel
      return debug 1, ()->return ["channel was sent to the wrong channel object", channel, @channel]

    @callbackForMethod(method)(null, args)

    switch method
      when methods.channelCloseOk
        @connection.channelManager.channelClosed(@channel)

        @state = 'closed'

        @_channelClosed(new Error("Channel closed"))
        @_callOutstandingCallbacks({msg: "Channel closed"})

      when methods.channelClose
        @connection.channelManager.channelClosed(channel)

        debug 1, ()->return "Channel closed by server #{JSON.stringify args}"
        @state = 'closed'

        if args.classId? and args.methodId?
          closingMethod = methodTable[args.classId][args.methodId].name
          @callbackForMethod(methods["#{closingMethod}Ok"])(args) #this would be the error

        @_channelClosed({msg: "Server closed channel", error: args})
        @_callOutstandingCallbacks("Channel closed by server #{JSON.stringify args}")

      when methods.channelOpenOk
        @state = 'open'
        @_channelOpen()
        @emit 'open'


      else
        @_onMethod( channel, method, args )

  _connectionClosed: ()->
    # if the connection closes, make sure we reflect that because that channel is also closed
    if @state isnt 'closed'
      @state = 'closed'
      @_channelClosed()
      if @channelTracker?
        clearInterval(@channelTracker)
        @channelTracker = null
}
