constants = require('./constants')
protocol  = require('./protocol')('../amqp-definitions-0-9-1')
DEBUG     = require('debug')

DEBUG_LEVEL = process.env.AMQP

debuggers = {}
debug     = (name)->
  if !DEBUG_LEVEL?
    return ()->
      # do nothing
  else
    return (level, message)->
      if !message? and level?
        message = level
        level   = 1

      if level <= DEBUG_LEVEL
        if !debuggers[name] then debuggers[name] = DEBUG(name)
        if typeof message is 'function' then message = message()
        debuggers[name](message)
      else
        return ()->
          # do nothing

module.exports = { constants, protocol, debug }
