# Temporary Channel
debug          = require('./config').debug('amqp:TemporaryChannel')
Channel        = require('./Channel')

# This is just a skeleton of a simple channel object to pass around

class TemporaryChannel extends Channel
  constructor: (connection, channel, cb)->
    super(connection, channel)
    @cb = cb
    @temporaryChannel()
    return @

  _channelOpen: () =>
    if @cb? then @cb(null, @)
    @cb = null

  _channelClosed: ()->
    # do nothing

  _onMethod: ()->
    # do nothing

module.exports = TemporaryChannel
