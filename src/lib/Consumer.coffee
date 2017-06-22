# Exchange
os = require('os')

debug = require('./config').debug('amqp:Consumer')
Channel = require('./Channel')
async = require('async')
defaults = require('./defaults')
applyDefaults = require('lodash/defaults')
extend = require('lodash/extend')
clone = require('lodash/clone')

BSON = require('bson')
bson = new BSON()

{ methodTable, classes, methods } = require('./config').protocol
{ MaxEmptyFrameSize } = require('./config').constants

CONSUMER_STATE_OPEN = 'open'
CONSUMER_STATE_OPENING = 'opening'

CONSUMER_STATE_CLOSED = 'closed'
CONSUMER_STATE_USER_CLOSED = 'user_closed'
CONSUMER_STATE_CHANNEL_CLOSED = 'channel_closed'
CONSUMER_STATE_CONNECTION_CLOSED = 'connection_closed'

CONSUMER_STATES_CLOSED = [CONSUMER_STATE_CLOSED, CONSUMER_STATE_USER_CLOSED, CONSUMER_STATE_CONNECTION_CLOSED, CONSUMER_STATE_CHANNEL_CLOSED]

class Consumer extends Channel

  constructor: (connection, channel)->
    debug 2, () -> return "channel open for consumer #{channel}"
    super(connection, channel)
    @consumerState = CONSUMER_STATE_CLOSED
    @messageHandler  = null

    @incomingMessage = null
    @outstandingDeliveryTags = {}
    return @

  consume: (queueName, options, messageHandler, cb)->
    if typeof options == 'function'
      if typeof messageHandler == 'function'
        cb = messageHandler

      messageHandler = options
      options = {}

    @consumerTag = options.consumerTag ? "#{os.hostname()}-#{process.pid}-#{Date.now()}"

    debug 2, () =>return "Consuming to #{queueName} on channel #{@channel} #{@consumerTag}"

    @consumerState = CONSUMER_STATE_OPENING

    if options.prefetchCount?
      # this should be a qos channel and we should expect ack's on messages
      @qos = true

      providedOptions = {prefetchCount: options.prefetchCount}
      providedOptions['global'] = options.global if options.global?

      qosOptions    = applyDefaults providedOptions, defaults.basicQos
      options.noAck = false
      delete options.prefetchCount
    else
      @qos = false
      options.noAck = true

    consumeOptions             = applyDefaults options, defaults.basicConsume
    consumeOptions.queue       = queueName
    consumeOptions.consumerTag = @consumerTag

    @messageHandler = messageHandler if messageHandler?
    if !@messageHandler? then return cb?("No message handler")

    @consumeOptions = consumeOptions
    @qosOptions     = qosOptions

    @_consume(cb)

    return @

  close: (cb)=>
    @cancel () =>
      @consumerState = CONSUMER_STATE_USER_CLOSED
      super()
      cb?()

  cancel: (cb)=>
    if !(@consumerState in CONSUMER_STATES_CLOSED)
      @taskPushPreflight methods.basicCancel, {consumerTag: @consumerTag, noWait:false}, methods.basicCancelOk, @_consumerStateOpenPreflight, cb
    else
      cb?()

  pause: (cb)->
    if !(@consumerState in CONSUMER_STATES_CLOSED)
      @cancel (err, res)=>
        # should pause be a different state?
        @consumerState = CONSUMER_STATE_USER_CLOSED
        cb?(err, res)
    else
      cb?()

  resume: (cb)->
    if @consumerState in CONSUMER_STATES_CLOSED
      @_consume(cb)
    else
      cb?()

  flow: (active, cb)->
    if active then @resume(cb) else @pause(cb)

  setQos: (prefetchCount, cb)->
    if typeof prefetchCount is 'function'
      cb = prefetchCount
      qosOptions = @qosOptions
    else
      # if our prefetch count has changed and we're rabbit version > 3.3.*
      # Rabbitmq 3.3.0 changes the behavior of qos.  we default to gloabl true in this case.
      if prefetchCount isnt @qosOptions.prefetchCount and \
         @connection.serverProperties?.product == 'RabbitMQ' and\
         ( @connection.serverProperties?.capabilities?.per_consumer_qos == true or \
         @connection.serverProperties?.version == "3.3.0" )

        global = true


      qosOptions = applyDefaults({prefetchCount, global}, @qosOptions)

    @taskPush methods.basicQos, qosOptions, methods.basicQosOk, cb

  # Private

  _consume: (cb)=>
    async.series [
      (next)=>
        if @qos
          @setQos next
        else
          next()

      (next)=>
        @taskQueuePushRaw {type: 'method', method: methods.basicConsume, args: @consumeOptions, okMethod: methods.basicConsumeOk, preflight: @_basicConsumePreflight}, next

      (next)=>
        @consumerState = CONSUMER_STATE_OPEN
        next()
    ], cb

  _basicConsumePreflight: () =>
    return @consumerState != CONSUMER_STATE_OPEN

  _consumerStateOpenPreflight: () =>
    return @consumerState == CONSUMER_STATE_OPEN

  _channelOpen: () =>
    if @consumeOptions? and @consumerState is CONSUMER_STATE_CONNECTION_CLOSED then @_consume()

  _channelClosed: (reason)=>
    # if we're reconnecting it is approiate to emit the error on reconnect, this is specifically useful
    # for auto delete queues
    if @consumerState is CONSUMER_STATE_CHANNEL_CLOSED
      if !reason? then reason = {}
      @emit 'error', reason

    @outstandingDeliveryTags = {}
    if @connection.state is 'open' and @consumerState is CONSUMER_STATE_OPEN
        @consumerState = CONSUMER_STATE_CHANNEL_CLOSED
        @_consume()
    else
      @consumerState = CONSUMER_STATE_CONNECTION_CLOSED


  # QOS RELATED Callbacks
  ack: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

      if @subscription.state is 'open'
        basicAckOptions = { deliveryTag: @deliveryTag, multiple: false }
        @subscription.connection._sendMethod @subscription.channel, methods.basicAck, basicAckOptions

  reject: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

      if @subscription.state is 'open'
        basicAckOptions = { deliveryTag: @deliveryTag, requeue: false }
        @subscription.connection._sendMethod @subscription.channel, methods.basicReject, basicAckOptions

  retry: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

      if @subscription.state is 'open'
        basicAckOptions = { deliveryTag: @deliveryTag, requeue: true }
        @subscription.connection._sendMethod @subscription.channel, methods.basicReject, basicAckOptions

  # CONTENT HANDLING
  _onMethod: (channel, method, args)->
    debug 3, ()->return "onMethod #{method.name}, #{JSON.stringify args}"
    switch method
      when methods.basicDeliver
        delete args['consumerTag'] # TODO evaluate if this is a good idea
        if @qos
          @incomingMessage = args
        else
          @incomingMessage = args

      when methods.basicCancel
        debug 1, ()->return "basicCancel"
        @consumerState = CONSUMER_STATE_CLOSED

        if @listeners('cancel').length > 0
          @emit 'cancel', "Server initiated basicCancel"
        else
          cancelError = new Error("Server initiated basicCancel")
          cancelError.code = 'basicCancel'
          @emit 'error', cancelError


  _onContentHeader: (channel, classInfo, weight, properties, size)->
    debug 3, ()->return "_onContentHeader #{JSON.stringify properties} #{size}"
    @incomingMessage = extend @incomingMessage, {weight, properties, size}

    # if we're only expecting one packet lets just copy the buffer when we get it
    # otherwise lets create a new incoming data buffer and pre alloc the space
    if size > @connection.frameMax - MaxEmptyFrameSize
      @incomingMessage.data      = Buffer.allocUnsafe(size)
      @incomingMessage.data.used = 0

    if size == 0
      @_onContent(channel, new Buffer(0))

  _onContent: (channel, data)=>
    if !@incomingMessage.data? and @incomingMessage.size is data.length
      # if our size is equal to the data we have, just replace the data object
      @incomingMessage.data = data

    else
      # if there are multiple packets just copy the data starting from the last used bit.
      data.copy(@incomingMessage.data, @incomingMessage.data.used)
      @incomingMessage.data.used += data.length

    if @incomingMessage.data.used >= @incomingMessage.size || @incomingMessage.size == 0
      message = clone @incomingMessage
      message.raw = @incomingMessage.data

      # DEFINE GETTERS ON THE DATA FIELD WHICH RETURN A COPY OF THE RAW DATA
      if @incomingMessage.properties?.contentType is "application/json"

        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: () ->
            try
              return JSON.parse message.raw.toString()
            catch e
              console.error e
              return message.raw
        }

      else if @incomingMessage.properties?.contentType is "application/bson"
        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: () ->
            try
              return bson.deserialize message.raw
            catch e
              console.error e
              return message.raw
        }

      else if @incomingMessage.properties?.contentType is "string/utf8"
        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: () ->
            try
              return message.raw.toString('utf8')
            catch e
              console.error e
              return message.raw
        }


      else if @incomingMessage.size == 0 and @incomingMessage.properties?.contentType is "application/undefined"
        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: () ->
            return undefined
        }


      else
        Object.defineProperty message, "data", {
          get: () ->
            return message.raw
        }

      if @qos
        message.ack    = @ack
        message.reject = @reject
        message.retry  = @retry
        message.subscription = @

      @outstandingDeliveryTags[@incomingMessage.deliveryTag] = true
      @messageHandler message

module.exports = Consumer
