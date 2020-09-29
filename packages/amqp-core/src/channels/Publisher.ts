/// Publisher
import _debug = require('debug')
import { BasicReturnError } from '@microfleet/amqp-connection'
import { Channel } from './Channel'
import rfdc = require('rfdc')
import {

} from '@microfleet/amqp-codec'

// defaults  = require('./defaults')

const debug = _debug('amqp:Publisher')
const clone = rfdc()

applyDefaults = require('lodash/defaults')

// { methodTable, classes, methods } = require('./config').protocol

export class Publisher extends Channel {

    constructor(private connection: Connection, 
                public channel: number, 
                public readonly confirm: boolean = false) {
        super(connection, channel)

        this.seqCallbacks = new Map() // publisher confirms
        this.currentMethod = null
        this.currentArgs   = null

        if (confirm) {
            this.confirmMode()
        }
    }

    async confirmMode() {
    @confirmState = 'opening'
    @taskPush methods.confirmSelect, {noWait:false}, methods.confirmSelectOk, () =>
      @confirmState = 'open'
      @confirm = true
      @seq     = 1
      cb() if cb?
      @emit 'confirm'

  _channelClosed: (message)=>
    @confirmState = 'closed'
    if !message? then message = "Channel closed, try again"

    for cb from @seqCallbacks.values()
      if typeof cb is 'function'
        cb(message)

    @seqCallbacks = new Map()

    if @confirm then @confirmMode()

  publish: (exchange, routingKey, data, options, cb)->
    if typeof options is 'function'
      cb = options
      options = {}

    # Because we add modify options, we want to make sure we only modify our internal version
    # this is why we clone it.
    if !options? then options = {} else options = clone options

    if @state isnt "open" or (@confirm and @confirmState isnt "open")
      if @state is "opening" or @state is "closed" or (@confirm and @confirmState is 'opening')

        if @confirm then waitFor = 'confirm' else waitFor = 'open'
        return @once waitFor, () =>
          @publish(exchange, routingKey, data, options, cb)

      else
        return cb(new Error("Channel is closed and will not re-open? #{@state} #{@confirm} #{@confirmState}")) if cb

    # data must be a buffer
    if typeof data is 'string'
      options.contentType = 'string/utf8'
      data = Buffer.from(data, 'utf8')

    else if typeof data is 'object' and !(data instanceof Buffer)
      if options.contentType?
        debug 1, () -> return "contentType specified but data isn't a buffer, #{JSON.stringify options}"
        if cb?
          cb("contentType specified but data isn't a buffer")
          return

      # default use JSON
      data = Buffer.from(JSON.stringify(data), 'utf8')
      options.contentType = 'application/json'

      # data = BSON.serialize data
      # options.contentType = 'application/bson'

    else if data is undefined
      data = Buffer.allocUnsafe(0)
      options.contentType = 'application/undefined'


    # increment this as the final step before publishing, to make sure we're in sync with the server
    thisSequenceNumber = @seq++ if @confirm

    # Apply default options after we deal with potentially converting the data
    options            = applyDefaults options, defaults.basicPublish
    options.exchange   = exchange
    options.routingKey = routingKey

    # This is to tie back this message as failed if it failed in confirm mode with a mandatory or immediate publish
    if @confirm and cb? and (options.mandatory || options.immediate)
      options.headers ?= {}
      options.headers['x-seq'] = thisSequenceNumber

    @queuePublish methods.basicPublish, data, options

    if @confirm and cb?
      debug 4, () -> return JSON.stringify {exchange, routingKey, data, options, thisSequenceNumber}
      @_waitForSeq thisSequenceNumber, cb
    else
      debug 4, () -> return JSON.stringify {exchange, routingKey, data, options, noConfirm: true}
      setImmediate(cb) if cb?


  _onMethod: (channel, method, args)->
    @currentMethod = method
    @currentArgs   = args

    switch method
      when methods.basicAck
        if @confirm
          # debug 4, () => return JSON.stringify args
          @_gotSeq args.deliveryTag, args.multiple

  _onContentHeader: (channel, classInfo, weight, properties, size)->
    switch @currentMethod
      when methods.basicReturn
        if properties.headers?['x-seq']?
          @_gotSeq properties.headers['x-seq'], false, new BasicReturnError(@currentArgs)

  _onContent: (channel, data)->
    # Content is not needed on a basicReturn

  _waitForSeq: (seq, cb)->
    if typeof cb is 'function'
      @seqCallbacks.set seq, cb
    else
      debug "callback requested for publish that isn't a function"
      console.error cb

  _gotSeq:(seq, multi, err = null)->
    if multi
      for key from @seqCallbacks.keys()
        if key <= seq
          @seqCallbacks.get(key)(err)
          @seqCallbacks.delete key
    else
      if @seqCallbacks.has(seq)
        @seqCallbacks.get(seq)(err)
      else
        debug 3, ()-> return "got a seq for #{seq} but that callback either doesn't exist or was already called or was returned"

      @seqCallbacks.delete seq

module.exports = Publisher
