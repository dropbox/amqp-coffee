/**
 *
 * Channel Manager
 * 
 * we track and manage all the channels on a connection.
 * we will dynamically add and remove publish channels...maybe
 * we track confirm channels and non confirm channels separately.
 *
 */

import type { Channel } from './Channel'
import type { Reconnectable as Connection } from '@microfleet/amqp-connection'

const kPublisherPoolSize = 1

import { Publisher } from './Publisher'
import { Consumer } from './Consumer'
import { TemporaryChannel } from './TemporaryChannel'

export interface Channels {
    [channelNumber: number]: Channel
}

export class ChannelManager {
    private channels: Channels
    private channelCount: number
    private publisherConfirmChannels: Publisher[] = []
    private publisherChannels: Publisher[] = []

    private tempChannel: TemporaryChannel | null = null
    private queue = null
    private exchange = null

    constructor(private connection: Connection) {
        this.channels = this.connection.channels
        this.channelCount = this.connection.channelCount
    }

    nextChannelNumber(): number {
        this.channelCount++
        return this.channelCount
    }

    publisherChannel(confirm = false): Promise<number> {
        let pool: Publisher[]
        if (confirm) {
            pool = this.publisherConfirmChannels
        } else {
            pool = this.publisherChannels
        }

        if (pool.length < kPublisherPoolSize) {
            const channel = this.nextChannelNumber()
            const p = new Publisher(this.connection, channel, confirm)
            this.channels[channel] = p
            pool.push(p)
            return p.channel
        } else {
            const i = Math.floor(Math.random() * pool.length)
            return pool[i].channel
        }
    }

    async temporaryChannel(): Promise<TemporaryChannel> {
        if (this.tempChannel === null) {
            const channel = this.nextChannelNumber()
            this.tempChannel = new TemporaryChannel(this.connection, channel)
            this.channels[channel] = this.tempChannel            
        }

        await this.tempChannel.ready()
        return this.tempChannel
    }

    consumerChannel(): number {
        const channel = this.nextChannelNumber()
        const s = new Consumer(this.connection, channel)
        this.channels[channel] = s
        return channel
    }

    channelReassign(channel: Channel): void {
        delete this.channels[channel.channel]
        const newChannelNumber = this.nextChannelNumber()
        channel.channel = newChannelNumber
        this.channels[newChannelNumber] = channel
    }

    channelClosed(channelNumber: number): void {
        delete this.channels[channelNumber]
    }

    isChannelClosed(channelNumber: number): boolean {
        return !Object.prototype.hasOwnProperty.call(this.channels, channelNumber)
    }
}

