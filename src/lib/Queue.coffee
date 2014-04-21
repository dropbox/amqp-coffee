# Queues
debug = require('./config').debug('amqp:Queue')
Channel        = require('./Channel')
defaults       = require('./defaults')

{ methodTable, classes, methods } = require('./config').protocol

_              = require('underscore')

class Queue
  ###
    @args.name(required)
    @cb function required
  ###
  constructor: (channel, args, cb)->
    debug 3, ()->return ["New queue", JSON.stringify(args)]
    if !args.queue? and args.name?
      args.queue = args.name
      delete args['name']

    if !args.queue?
      cb("args.queue is required") if cb?
      return

    @queueOptions = _.defaults args, defaults.queue

    @channel  = channel
    @taskPush = channel.taskPush

    if cb? then cb(null, @)

  declare: (args={}, cb)->
    if typeof args is 'function'
      cb = args
      args = {}
      declareOptions = @queueOptions
    else
      declareOptions = _.defaults args, @queueOptions

    @taskPush methods.queueDeclare, declareOptions, methods.queueDeclareOk, cb

  bind: (exchange, routingKey, queueName, cb)=>
    if typeof queueName is 'string'
      queueName =  queueName
    else
      cb = queueName
      queueName = @queueOptions.queue

    queueBindOptions = {
      queue:      queueName
      exchange:   exchange
      routingKey: routingKey
      arguments: {}
    }
    @taskPush methods.queueBind, queueBindOptions, methods.queueBindOk, cb

  unbind: (exchange, routingKey, queueName, cb)=>
    if typeof queueName is 'string'
      queueName =  queueName
    else
      cb = queueName
      queueName = @queueOptions.queue

    queueUnbindOptions = {
      queue:      queueName
      exchange:   exchange
      routingKey: routingKey
      arguments: {}
    }
    @taskPush methods.queueUnbind, queueUnbindOptions, methods.queueUnbindOk, cb


  messageCount: (args={}, cb)=>
    if typeof args is 'function'
      cb = args
      args = {}

    declareOptions = _.defaults args, @queueOptions

    @declare declareOptions, (err, res)->
      cb(err, res.messageCount)

  consumerCount: (args={}, cb)->
    if typeof args is 'function'
      cb = args
      args = {}

    declareOptions = _.defaults args, @queueOptions

    @declare declareOptions, (err, res)->
      cb(err, res.consumerCount)

  delete: (args={}, cb)=>
    if typeof args is 'function'
      cb = args
      args = {}

    queueDeleteArgs = _.defaults args, defaults.queueDelete, {queue: @queueOptions.queue}
    @taskPush methods.queueDelete, queueDeleteArgs, methods.queueDeleteOk, cb

module.exports = Queue
