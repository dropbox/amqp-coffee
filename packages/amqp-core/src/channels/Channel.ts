/**
 * Channel
 */

import { EventEmitter } from 'events'
import Limit from 'p-limit'
import { 
    MethodFrame, 
    MethodFrameOk, 
    methods, 
    classMethodsTable, 
    isClassMethodId, 
    MethodNames, 
    FrameType,
    ContentHeader
} from '@microfleet/amqp-codec'
import { ServerError } from '@microfleet/amqp-connection'
import Connection, { ClusterStatus } from '@microfleet/amqp-connection'
import _debug = require('debug')
import { once } from 'events'

const debug = _debug('amqp-core:Channel')

export const enum CHANNEL_STATE {
    Closed = 'CLOSED',
    Opening = 'OPENING',
    Open = 'OPEN',
}

type onMethodCallback = (err: Error | null, result?: unknown) => void

const enum TaskType {
    method = "method",
    publish = "publish"
}

type okMethodFrames = MethodFrameOk['method']

export type TaskMethod = {
    type: TaskType.method;
    method: MethodFrame;
    okMethod?: okMethodFrames;
    preflight?: () => boolean;
}

export type TaskPublish = {
    type: TaskType.publish;
    method: MethodFrame;
    okMethod?: okMethodFrames;
    preflight?: () => boolean;
    data: Buffer;
    header: Omit<ContentHeader, 'size'>;
}

export type Task = TaskMethod | TaskPublish

export class Channel extends EventEmitter {
    private state = CHANNEL_STATE.Closed
    private transactional = false
    private waitingCallbacks: { [key in keyof typeof methods]: onMethodCallback[] }
    private limit = Limit(1)
    private lastChannelAccess = 0
    private channelTracker: NodeJS.Timer | null = null
    private tmpChannelTimeout = this.connection.config.temporaryChannelTimeout
    private tmpChannelTimeoutCheck = this.connection.config.temporaryChannelTimeoutCheck

    constructor(private connection: Connection, public channel: number) {
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

        await Promise.all([
            this.waitForMethod(methods.channelOpenOk),
            this.sendMethod({ 
                type: FrameType.METHOD,
                name: MethodNames.channelOpen,
                method: methods.channelOpen,
            })
        ])

        this.connection.channelCount += 1
        if (this.transactional) {
            this.temporaryChannel()
        }
    }

    public async reset(): Promise<void> {
        if (this.state !== CHANNEL_STATE.Open) {
            this.callOutstandingCallbacks(new Error('Channel is Opening or Resetting'))
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

    async crash(wait = false): Promise<boolean> {
        if (process.env.AMQP_TEST == null) {
            return true
        }

        // this will crash a channel forcing a channelOpen from the server
        // this is really only for testing
        debug('Trying to crash channel')
        this.connection.sendMethod(this.channel, {
            type: FrameType.METHOD,
            method: methods.queuePurge, 
            name: MethodNames.queuePurge,
            args: { queue: 'idontexist' }
        })

        if (wait) await this.waitForMethod(methods.channelClose)
        return false
    }

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
            this.sendMethod({
                type: FrameType.METHOD,
                method: methods.channelClose,
                name: MethodNames.channelClose,
                args: {
                    replyText: 'Goodbye',
                    replyCode: 200,
                    classId: 0,
                    methodId: 0
                }
            })
        }
    }

    public async sendMethod(method: MethodFrame): Promise<void> {
        return this.connection.sendMethod(this.channel, method)
    }

    public async sendData(data: Buffer, header: Omit<ContentHeader, 'size'>): Promise<void> {
        return this.connection.sendBody(this.channel, { type: FrameType.BODY, data }, header)
    }

    async waitForMethod<T>(method: MethodFrame['method']): Promise<T> {
        return new Promise((resolve, reject) => {
            this.waitingCallbacks[method.name].push((err, result) => {
                if (err) return reject(err)
                resolve(result as T)
            })
        })
    }

    callbackForMethod(method?: MethodFrame['method']): onMethodCallback {
        if (!method) {
            return () => true
        }

        const cb = this.waitingCallbacks[method.name].shift()
        if (this.waitingCallbacks[method.name].length === 0) {
            delete this.waitingCallbacks[method.name]
        }

        return cb || (() => true)
    }

    // Functions to overwrite
    onChannelOpen(): never {
        throw new Error('channel open called and should be overwritten')
    }

    channelClosed(err?: Error): never {
        throw new Error('channel closed called and should be overwritten')
    }

    onChannelReconnect(): never {
        throw new Error('channel reconnect called and should be overwritten')
    }

    onMethod(channel: number, method: MethodFrame): never {
        throw new Error('_onMethod MUST be overwritten by whoever extends Channel')
    }

    // TASK QUEUEING ---------------------------------------------------------
    async taskPush<T>(method: MethodFrame, okMethod: okMethodFrames): Promise<T | undefined> {
        return this.limit<[TaskMethod], T | undefined>(this.taskWorker, { type: TaskType.method, method, okMethod })
    }

    async taskPushPreflight<T>(method: MethodFrame, okMethod: okMethodFrames, preflight: () => boolean): Promise<T | undefined> {
        return this.limit<[TaskMethod], T | undefined>(this.taskWorker, { type: TaskType.method, method, okMethod, preflight })
    }

    async taskQueuePushRaw<T>(task: Task): Promise<T | undefined> {
        return this.limit<[Task], T | undefined>(this.taskWorker, task)
    }

    async queuePublish<T>(method: MethodFrame, data: Buffer, header: Omit<ContentHeader, 'size'>): Promise<T | undefined> {
        return this.limit<[TaskPublish], T | undefined>(this.taskWorker, { type: TaskType.publish, method, data, header })
    }

    private async taskWorker<ReturnType>(task: Task): Promise<ReturnType | undefined> {
        if (this.transactional) {
            this.lastChannelAccess = Date.now()
        }

        const { method, okMethod, preflight } = task

        // if preflight is false do not proceed
        if (preflight != null && !preflight()) {
            throw new Error('preflight check failed')
        }

        if (this.state === CHANNEL_STATE.Closed && this.connection.status === ClusterStatus.Ready) {
            debug('Channel reassign')
            this.connection.channelManager.channelReassign(this)
            await this.open()
            return this.taskWorker(task)
        }

        if (this.state !== CHANNEL_STATE.Open) {
            // if our connection is closed that ok, but if its destroyed it will not reopen
            if (this.connection.status === ClusterStatus.Close) {
                throw new Error('Connection is destroyed')
            }
            
            if (this.connection.channelManager.isChannelClosed(this.channel)) {
                this.connection.channelManager.channelReassign(this)
            }

            await once(this, 'open')
            return this.taskWorker(task)
        }

        // if (okMethod) await this.waitForMethod(okMethod)
        switch (task.type) {
            case TaskType.method: {
                const p = this.sendMethod(method)
                const r = okMethod ? this.waitForMethod<ReturnType>(okMethod) : undefined
                const [res] = await Promise.all([r, p])
                return res
            }

            case TaskType.publish: {
                this.sendMethod(method)
                const p = this.sendData(task.data, task.header)
                const r = okMethod ? this.waitForMethod<ReturnType>(okMethod) : undefined
                const [res] = await Promise.all([r, p])
                return res
            }
        }
    }

    callOutstandingCallbacks(message: Error = new Error('Channel Unavaliable')): void {
        const outStandingCallbacks = this.waitingCallbacks
        this.waitingCallbacks = Object.create(null)

        for (const cbs of Object.values(outStandingCallbacks)) {
            for (const cb of cbs.values()) {
                cb(message)
            }
        }
    }

    // incomming channel messages for us
    onChannelMethod(channel: number, method: MethodFrame): void {
        if (this.transactional) {
            this.lastChannelAccess = Date.now()
        }

        if (channel !== this.channel) {
            debug('channel was sent to the wrong channel object', channel, this.channel)
            return
        }

        this.callbackForMethod(method.method)(null, method.args)

        switch (method.name) {
        case MethodNames.channelCloseOk:
            this.connection.channelManager.channelClosed(this.channel)
            this.state = CHANNEL_STATE.Closed

            this.channelClosed(new Error('Channel closed'))
            this.callOutstandingCallbacks(new Error('Channel closed'))
            break

        case MethodNames.channelClose: {
            const { args } = method
            this.connection.channelManager.channelClosed(channel)
            debug('Channel closed by server %j', args)
            this.state = CHANNEL_STATE.Closed

            const classMethodId = `${args.classId}_${args.methodId}`
            const err = new ServerError(args)

            if (isClassMethodId(classMethodId)) {
                const closingMethod = `${classMethodsTable[classMethodId].name}Ok` as MethodNames
                this.callbackForMethod(methods[closingMethod])(err)  // this would be the error
            }

            this.channelClosed(err)
            this.callOutstandingCallbacks(err)
            break
        }

        case MethodNames.channelOpenOk:
            this.state = CHANNEL_STATE.Open
            this.onChannelOpen()
            this.emit('open')
            break

        default:
            this.onMethod(channel, method)
        }
    }

    public connectionClosed(): void {
        // if the connection closes, make sure we reflect that because that channel is also closed
        if (this.state !== CHANNEL_STATE.Closed) {
            this.state = CHANNEL_STATE.Closed
            this.channelClosed()
        }

        if (this.channelTracker != null) {
            clearInterval(this.channelTracker)
            this.channelTracker = null
        }
    }
}
