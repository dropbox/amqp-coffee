# Queues
debug = require('./config').debug('amqp:Queue')
Channel        = require('./Channel')
defaults       = require('./defaults')

{ methodTable, classes, methods } = require('./config').protocol

_              = require('lodash')

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
    queueNameSpecified = args.queue? and args.queue isnt ""

    if typeof args is 'function'
      cb = args
      args = {}
      declareOptions = @queueOptions
    else
      declareOptions = _.defaults args, @queueOptions

    @taskPush methods.queueDeclare, declareOptions, methods.queueDeclareOk, (err, res)=>
      if !queueNameSpecified and !err? and res.queue?
        @queueOptions.queue = res.queue
      cb?(err, res)

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
      return cb(err) if err?
      if res?.messageCount?
        cb(null, res.messageCount)
      else
        cb('messageCount not returned')


  consumerCount: (args={}, cb)->
    if typeof args is 'function'
      cb = args
      args = {}

    declareOptions = _.defaults args, @queueOptions

    @declare declareOptions, (err, res)->
      return cb(err) if err?
      if res?.consumerCount?
        cb(null, res.consumerCount)
      else
        cb('consumerCount not returned')

  delete: (args={}, cb)=>
    if typeof args is 'function'
      cb = args
      args = {}

    queueDeleteArgs = _.defaults args, defaults.queueDelete, {queue: @queueOptions.queue}
    @taskPush methods.queueDelete, queueDeleteArgs, methods.queueDeleteOk, cb

module.exports = Queue
