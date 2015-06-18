# Publisher
debug     = require('./config').debug('amqp:Publisher')
Channel   = require('./Channel')
defaults  = require('./defaults')

_         = require('underscore')

{BSON} = require('bson').BSONPure

{ methodTable, classes, methods } = require('./config').protocol

class Publisher extends Channel

  constructor: (connection, channel, confirm)->
    super(connection, channel)

    @seqCallbacks     = {} # publisher confirms
    @confirm          = confirm ? false

    @currentMethod = null
    @currentArgs   = null

    if @confirm then @confirmMode()
    return @

  confirmMode: (cb)=>
    @confirmState = 'opening'
    @taskPush methods.confirmSelect, {noWait:false}, methods.confirmSelectOk, ()=>
      @confirmState = 'open'
      @confirm = true
      @seq     = 1
      cb() if cb?
      @emit 'confirm'

  _channelClosed: (message)=>
    @confirmState = 'closed'
    if !message? then message = "Channel closed, try again"

    for key, cb of @seqCallbacks
      if typeof cb is 'function'
        cb(message)

    @seqCallbacks = {}

    if @confirm then @confirmMode()

  publish: (exchange, routingKey, data, options, cb)->
    if typeof options is 'function'
      cb = options
      options = {}

    # Because we add modify options, we want to make sure we only modify our internal version
    # this is why we clone it.
    if !options? then options = {} else options = _.clone options

    if @state isnt "open" or (@confirm and @confirmState isnt "open")
      if @state is "opening" or @state is "closed" or (@confirm and @confirmState is 'opening')

        if @confirm then waitFor = 'confirm' else waitFor = 'open'
        return @once waitFor, ()=>
          @publish(exchange, routingKey, data, options, cb)

      else
        return cb("Channel is closed and will not re-open? #{@state} #{@confirm} #{@confirmState}") if cb

    # data must be a buffer
    if typeof data is 'string'
      options.contentType = 'string/utf8'
      data = new Buffer(data, 'utf8')

    else if typeof data is 'object' and !(data instanceof Buffer)
      if options.contentType?
        debug 1, ()=> return "contentType specified but data isn't a buffer, #{JSON.stringify options}"
        if cb?
          cb("contentType specified but data isn't a buffer")
          return

      # default use JSON
      data = new Buffer(JSON.stringify(data), 'utf8')
      options.contentType = 'application/json'

      # data = BSON.serialize data
      # options.contentType = 'application/bson'

    # increment this as the final step before publishing, to make sure we're in sync with the server
    thisSequenceNumber = @seq++ if @confirm

    # Apply default options after we deal with potentially converting the data
    options            = _.defaults options, defaults.basicPublish
    options.exchange   = exchange
    options.routingKey = routingKey

    # This is to tie back this message as failed if it failed in confirm mode with a mandatory or immediate publish
    if @confirm and cb? and (options.mandatory || options.immediate )
      options.headers ?= {}
      options.headers['x-seq'] = thisSequenceNumber

    @queuePublish methods.basicPublish, data, options

    if @confirm and cb?
      debug 4, ()=> return JSON.stringify {exchange, routingKey, data, options, thisSequenceNumber}
      @_waitForSeq thisSequenceNumber, cb
    else
      debug 4, ()=> return JSON.stringify {exchange, routingKey, data, options, noConfirm: true}
      _.defer(cb) if cb?


  _onMethod: (channel, method, args)->
    @currentMethod = method
    @currentArgs   = args

    switch method
      when methods.basicAck
        if @confirm
          # debug 4, ()=> return JSON.stringify args
          @_gotSeq args.deliveryTag, args.multiple

  _onContentHeader: (channel, classInfo, weight, properties, size)->
    switch @currentMethod
      when methods.basicReturn
        if properties.headers?['x-seq']?
          @_gotSeq properties.headers['x-seq'], false, @currentArgs

  _onContent: (channel, data)->
    # Content is not needed on a basicReturn

  _waitForSeq: (seq, cb)->
    if typeof cb is 'function'
      @seqCallbacks[seq] = cb
    else
      debug "callback requested for publish that isn't a function"
      console.error cb

  _gotSeq:(seq, multi, err = null)->
    if multi
      keys = _.keys @seqCallbacks
      for key in keys
        if key <= seq
          @seqCallbacks[key](err)
          delete @seqCallbacks[key]
    else
      if @seqCallbacks[seq]?
        @seqCallbacks[seq](err)
      else
        debug 3, ()-> return "got a seq for #{seq} but that callback either doesn't exist or was already called or was returned"

      delete @seqCallbacks[seq]

module.exports = Publisher
