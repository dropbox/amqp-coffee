# Exchange
os        = require('os')

debug     = require('./config').debug('amqp:Consumer')
Channel   = require('./Channel')
_         = require('underscore')
async     = require('async')
defaults  = require('./defaults')

{BSON} = require('bson').BSONPure


{ methodTable, classes, methods } = require('./config').protocol
{ MaxFrameSize } = require('./config').constants

class Consumer extends Channel

  constructor: (connection, channel)->
    debug 2, ()=>return "channel open for consumer #{channel} #{@consumerTag}"
    super(connection, channel)
    @consumerState = 'closed'
    @messageHandler  = null

    @incomingMessage = null
    @outstandingDeliveryTags = {}
    return @

  consume: (queueName, options, messageHandler, cb)->
    @consumerTag = "#{os.hostname()}-#{process.pid}-#{Date.now()}"

    debug 2, ()=>return "Consuming to #{queueName} on channel #{@channel}"
    @consumerState = 'opening'

    if options.prefetchCount?
      # this should be a qos channel and we should expect ack's on messages
      @qos = true
      qosOptions    = _.defaults {prefetchCount: options.prefetchCount}, defaults.basicQos
      options.noAck = false
      delete options.prefetchCount
    else
      @qos = false
      options.noAck = true

    consumeOptions             = _.defaults options, defaults.basicConsume
    consumeOptions.queue       = queueName
    consumeOptions.consumerTag = @consumerTag

    @messageHandler = messageHandler if messageHandler?
    if !@messageHandler? then return cb("No message handler")

    @consumeOptions = consumeOptions
    @qosOptions     = qosOptions

    @_consume(cb)

    return @

  cancel: (cb)=>
    @consumerState = 'canceled'
    @taskPush methods.basicCancel, {consumerTag: @consumerTag, noWait:false}, methods.basicCancelOk, cb

  pause: (cb)->
    if @consumerState isnt 'canceled' then @cancel(cb) else cb()

  resume: (cb)->
    if @consumerState isnt 'open' then @_consume(cb) else cb()

  flow: (active, cb)->
    if active then @resume(cb) else @pause(cb)

  setQos: (prefetchCount, cb)->
    if typeof prefetchCount is 'function'
      cb = prefetchCount
      qosOptions = @qosOptions
    else
      qosOptions = _.defaults({prefetchCount},@qosOptions)

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
        @taskPush methods.basicConsume, @consumeOptions, methods.basicConsumeOk, next

      (next)=>
        @consumerState = 'open'
        next()
    ], cb

  _channelOpen: ()=>
    if @consumeOptions? and @consumerState is 'closed' then @_consume()

  _channelClosed: ()=>
    @outstandingDeliveryTags = {}
    if @connection.state is 'open' and @consumerState is 'open'
      if @connection.state is 'open'
        @consumerState = 'opening'
        @_consume()
      else
        @consumerState = 'closed'
    else
      @consumerState = 'closed'

  # QOS RELATED Callbacks
  ack: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

      basicAckOptions = { deliveryTag: @deliveryTag, multiple: false }
      @subscription.connection._sendMethod @subscription.channel, methods.basicAck, basicAckOptions

  reject: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

      basicAckOptions = { deliveryTag: @deliveryTag, requeue: false }
      @subscription.connection._sendMethod @subscription.channel, methods.basicReject, basicAckOptions

  retry: ()->
    if @subscription.qos and @subscription.outstandingDeliveryTags[@deliveryTag]?
      delete @subscription.outstandingDeliveryTags[@deliveryTag]

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

  _onContentHeader: (channel, classInfo, weight, properties, size)->
    debug 3, ()->return "_onContentHeader #{properties}"
    @incomingMessage = _.extend @incomingMessage, {weight, properties, size}

    # if we're only expecting one packet lets just copy the buffer when we get it
    if size > MaxFrameSize
      @incomingMessage.data      = new Buffer(size)
      @incomingMessage.data.used = 0

  _onContent: (channel, data)=>
    if !@incomingMessage.data? and @incomingMessage.size is data.length
      # if our size is equal to the data we have, just replace the data object
      @incomingMessage.data = data
    else
      # if there are multiple packets just copy the data starting from the last used bit.
      data.copy(@incomingMessage.data, @incomingMessage.data.used)
      @incomingMessage.data.used += data.length

    if @incomingMessage.data.used >= @incomingMessage.size
      message = _.clone @incomingMessage
      message.raw = @incomingMessage.data

      # DEFINE GETTERS ON THE DATA FIELD WHICH RETURN A COPY OF THE RAW DATA
      if @incomingMessage.properties?.contentType is "application/json"

        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: ()=>
            try
              return JSON.parse message.raw.toString()
            catch e
              return message.raw
        }

      else if @incomingMessage.properties?.contentType is "application/bson"
        # we use defineProperty here because we want to keep our original message intact and dont want to pass around a special message
        Object.defineProperty message, "data", {
          get: ()=>
            try
              return BSON.deserialize message.raw
            catch e
              console.error e
              return message.raw
        }


      else
        Object.defineProperty message, "data", {
          get: ()=>
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
