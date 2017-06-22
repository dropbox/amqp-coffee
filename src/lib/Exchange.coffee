# Exchange
debug          = require('./config').debug('amqp:Exchange')
{ methods }    = require('./config').protocol
defaults       = require('./defaults')

applyDefaults = require('lodash/defaults')

class Exchange
  constructor: (channel, args, cb)->
    if !args.exchange? and args.name?
      args.exchange = args.name
      delete args['name']

    if !args.exchange?
      cb("args.exchange is requried") if cb?
      return

    @exchangeOptions = applyDefaults args, defaults.exchange

    @channel  = channel
    @taskPush = channel.taskPush

    if cb? then cb(null, @)

  declare: (args, cb)->
    if !args? and !cb?
      declareOptions = @exchangeOptions

    else if typeof args is 'function'
      cb = args
      args = {}
      declareOptions = @exchangeOptions
    else
      declareOptions = applyDefaults args, @exchangeOptions

    @taskPush methods.exchangeDeclare, declareOptions, methods.exchangeDeclareOk, cb
    return @

  delete: (args, cb)=>
    if typeof args is 'function'
      cb = args
      args = {}

    exchangeDeleteOptions = applyDefaults args, defaults.exchangeDelete, {exchange: @exchangeOptions.exchange}

    @taskPush methods.exchangeDelete, exchangeDeleteOptions, methods.exchangeDeleteOk, cb
    return @

  bind: (destExchange, routingKey, sourceExchange, cb)=>
    if typeof sourceExchange is 'string'
      sourceExchangeName =  sourceExchange
    else
      cb = sourceExchange
      sourceExchangeName = @exchangeOptions.exchange

    exchangeBindOptions = {
      destination:  destExchange
      source:       sourceExchangeName
      routingKey:   routingKey
      arguments: {}
    }

    @taskPush methods.exchangeBind, exchangeBindOptions, methods.exchangeBindOk, cb
    return @

  unbind: (destExchange, routingKey, sourceExchange, cb)=>
    if typeof sourceExchange is 'string'
      sourceExchangeName =  sourceExchange
    else
      cb = sourceExchange
      sourceExchangeName = @exchangeOptions.exchange

    exchangeUnbindOptions = {
      destination:  destExchange
      source:       sourceExchangeName
      routingKey:   routingKey
      arguments: {}
    }

    @taskPush methods.exchangeUnbind, exchangeUnbindOptions, methods.exchangeUnbindOk, cb
    return @




module.exports = Exchange
