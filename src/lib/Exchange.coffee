# Exchange
debug          = require('./config').debug('amqp:Exchange')
{ methods }    = require('./config').protocol
defaults       = require('./defaults')

_              = require('lodash')

class Exchange
  constructor: (channel, args, cb)->
    if !args.exchange? and args.name?
      args.exchange = args.name
      delete args['name']

    if !args.exchange?
      cb("args.exchange is requried") if cb?
      return

    @exchangeOptions = _.defaults args, defaults.exchange

    @channel  = channel
    @taskPush = channel.taskPush

    if cb? then cb(null, @)

  declare: (args, cb)->
    if typeof args is 'function'
      cb = args
      args = {}
      declareOptions = @exchangeOptions
    else
      declareOptions = _.defaults args, @exchangeOptions

    @taskPush methods.exchangeDeclare, declareOptions, methods.exchangeDeclareOk, cb

  delete: (args, cb)=>
    if typeof args is 'function'
      cb = args
      args = {}

    exchangeDeleteOptions = _.defaults args, defaults.exchangeDelete, {exchange: @exchangeOptions.exchange}

    @taskPush methods.exchangeDelete, exchangeDeleteOptions, methods.exchangeDeleteOk, cb


module.exports = Exchange
