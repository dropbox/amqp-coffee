/**
 * Channel
 */

import { EventEmitter } from 'events'
import Limit from 'p-limit'
import { methods, MethodsTableMethod } from '@microfleet/amqp-codec'
import Connection from '@microfleet/amqp-connection'
import _debug = require('debug')

const debug = _debug('amqp-core:Channel')

export const enum CHANNEL_STATE {
    Closed = 'CLOSED',
    Opening = 'OPENING',
    Open = 'OPEN',
}

type onMethodCallback = (err: Error | null, result?: unknown) => void

export class Channel extends EventEmitter {
    private state = CHANNEL_STATE.Closed
    private transactional = false
    private waitingCallbacks: { [key in keyof typeof methods]: onMethodCallback[] }
    private limit = Limit(1)
    private lastChannelAccess = 0
    private channelTracker: NodeJS.Timer | null = null
    private tmpChannelTimeout = this.connection.config.temporaryChannelTimeout
    private tmpChannelTimeoutCheck = this.connection.config.temporaryChannelTimeoutCheck

    constructor(private connection: Connection, private channel: number) {
        super()
        this.open()

        // so that we don't have to do checks on the fly
        const methodsCallbackTable: Record<string, any> = {}
        for (const method of Object.values(methods)) {
            methodsCallbackTable[method.name] = []
        }
        this.waitingCallbacks = Object.setPrototypeOf(methodsCallbackTable, null)
    }

    public temporaryChannel(): void {
        this.transactional = true // THIS IS NOT AMQP TRANSACTIONS
        this.lastChannelAccess = Date.now()

        if (this.channelTracker) {
            return
        }
            
        this.channelTracker = setInterval(() => {
            if (this.lastChannelAccess >= (Date.now() - this.tmpChannelTimeout)) {
                return
            }

            debug('Closing channel due to inactivity')
            this.close(true)
        }, this.tmpChannelTimeoutCheck)
    }

    public async open(): Promise<void> {
        if (this.state !== CHANNEL_STATE.Closed) {
            throw new Error('state isn\'t closed.not opening channel')
        }

        this.state = CHANNEL_STATE.Opening

        this.waitForMethod(methods.channelOpenOk)
        this.sendMethod(methods.channelOpen)
        this.connection.channelCount += 1

        if (this.transactional) {
            this.temporaryChannel()
        }
    }

    public async reset() {
        if (this.state !== CHANNEL_STATE.Open) {
            this.callOutstandingCallbacks(new Error('Channel Opening or Reseting'))
        }
        
        // if our state is closed and either we arn't a transactional channel (queue, exchange declare etc..)
        // or we're within our acceptable time window for this queue
        if (this.state === CHANNEL_STATE.Closed && (
            !this.transactional || 
            this.listenerCount('open') > 0 || 
            (this.transactional && this.lastChannelAccess > (Date.now() - this.tmpChannelTimeout)))) {
            debug('State is closed... reconnecting')
            
            await this.open()
            await this.onChannelReconnect()
        }
    }

//   crash: (cb)=>
//     if !process.env.AMQP_TEST?
//       cb?()
//       return true

//     # this will crash a channel forcing a channelOpen from the server
//     # this is really only for testing
//     debug "Trying to crash channel"
//     @connection._sendMethod @channel, methods.queuePurge, {queue:"idontexist"}
//     @waitForMethod(methods.channelClose, cb) if cb?

    public close(auto = false): void {
        if (!auto) {
            debug('User requested channel close')
        }

        if (this.channelTracker) {
            clearInterval(this.channelTracker)
            this.channelTracker = null
        }

        if (this.state === CHANNEL_STATE.Open) {
            this.connection.channelCount -= 1
            this.state = CHANNEL_STATE.Closed
            this.sendMethod(methods.channelClose, {
                replyText: 'Goodbye',
                replyCode: 200,
                classId: 0,
                methodId: 0
            })
        }
    }

    public async sendMethod(method: MethodsTableMethod, args: unknown = {}): Promise<void> {
        return this.connection.sendMethod(this.channel, method, args)
    }

    async waitForMethod(method: MethodsTableMethod): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.waitingCallbacks[method.name].push((err, result) => {
                if (err) return reject(err)
                resolve(result)
            })
        })
    }

    callbackForMethod(method?: MethodsTableMethod): onMethodCallback {
        if (!method) {
            return () => true
        }

        const cb = this.waitingCallbacks[method.name].shift()
        if (this.waitingCallbacks[method.name].length === 0) {
            delete this.waitingCallbacks[method.name]
        }

        return cb
    }


//   # Functions to overwrite
//   _channelOpen: ()->
//     debug 4, ()->return "channel open called and should be overwritten"

//   _channelClosed: ()->
//     debug 4, ()->return "channel closed called and should be overwritten"

//   _onChannelReconnect: (cb)->
//     debug 4, ()->return "channel reconnect called and should be overwritten"
//     cb()

//   _onMethod: (method, args)->
//     debug 3, ()->return "_onMethod MUST be overwritten by whoever extends Channel"


//   # TASK QUEUEING ---------------------------------------------------------
//   taskPush: ( method, args, okMethod, cb)=> # same as queueSendMethod
//     @queue.push {type: 'method', method, args, okMethod, cb}

//   taskPushPreflight: ( method, args, okMethod, preflight, cb)=>
//     @queue.push {type: 'method', method, args, okMethod, preflight, cb}

//   taskQueuePushRaw: (task, cb)=>
//     task.cb = cb if cb? and task?
//     @queue.push task

//   queueSendMethod: (method, args, okMethod, cb)=>
//     @queue.push {type: 'method', method, args, okMethod, cb}

//   queuePublish: (method, data, options)=>
//     @queue.push {type: 'publish', method, data, options}

//   _taskWorker: (task, done)=>
//     if @transactional then @lastChannelAccess = Date.now()
//     {type, method, okMethod, args, cb, data, options, preflight} = task

//     doneFn = (err, res)->
//       cb(err, res) if cb?
//       if OVERFLOW_PROTECTION > 100
//         OVERFLOW_PROTECTION = 0
//         defer done
//       else
//         OVERFLOW_PROTECTION++
//         done()

//     # if preflight is false do not proceed
//     if preflight? and !preflight()
//       return doneFn(new Error('preflight check failed'))

//     if @state is 'closed' and @connection.state is 'open'
//       debug 1, ()->return "Channel reassign"
//       @connection.channelManager.channelReassign(@)
//       @open (e, r)=>
//         @_taskWorker(task, done)

//     else if @state isnt 'open'
//       # if our connection is closed that ok, but if its destroyed it will not reopen
//       if @connection.state is 'destroyed'
//         doneFn(new Error("Connection is destroyed"))

//       else
//         if @connection.channelManager.isChannelClosed(@channel)
//           @connection.channelManager.channelReassign(@)
//         @once 'open', () =>
//           @_taskWorker(task, done)

//     else
//       @waitForMethod(okMethod, doneFn) if okMethod?

//       if type is 'method'
//         @connection._sendMethod(@channel, method, args)
//         doneFn() if !okMethod?

//       else if type is 'publish'
//         @connection._sendMethod(@channel, method, options)
//         @connection._sendBody @channel, data, options, (err, res)->
//         doneFn() if !okMethod?

//       else
//         throw new Error("a task was queue with an unknown type of #{type}")


//   _callOutstandingCallbacks: (message)=>
//     outStandingCallbacks = @waitingCallbacks
//     @waitingCallbacks    = {}

//     if !message? then message = "Channel Unavaliable"
//     for key, cbs of outStandingCallbacks
//       for cb in cbs
//         cb?(message)


//   # incomming channel messages for us
//   _onChannelMethod: (channel, method, args)->
//     if @transactional then @lastChannelAccess = Date.now()

//     if channel isnt @channel
//       return debug 1, ()->return ["channel was sent to the wrong channel object", channel, @channel]

//     @callbackForMethod(method)(null, args)

//     switch method
//       when methods.channelCloseOk
//         @connection.channelManager.channelClosed(@channel)

//         @state = 'closed'

//         @_channelClosed(new Error("Channel closed"))
//         @_callOutstandingCallbacks({msg: "Channel closed"})

//       when methods.channelClose
//         @connection.channelManager.channelClosed(channel)

//         debug 1, ()->return "Channel closed by server #{JSON.stringify args}"
//         @state = 'closed'

//         if args.classId? and args.methodId?
//           closingMethod = methodTable[args.classId][args.methodId].name
//           @callbackForMethod(methods["#{closingMethod}Ok"])(args) #this would be the error

//         @_channelClosed({msg: "Server closed channel", error: args})
//         @_callOutstandingCallbacks("Channel closed by server #{JSON.stringify args}")

//       when methods.channelOpenOk
//         @state = 'open'
//         @_channelOpen()
//         @emit 'open'


//       else
//         @_onMethod( channel, method, args )

//   _connectionClosed: ()->
//     # if the connection closes, make sure we reflect that because that channel is also closed
//     if @state isnt 'closed'
//       @state = 'closed'
//       @_channelClosed()
//       if @channelTracker?
//         clearInterval(@channelTracker)
//         @channelTracker = null

}
