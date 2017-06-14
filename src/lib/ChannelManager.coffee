###

Channel Manager

we track and manage all the channels on a connection.
we will dynamically add and remove publish channels... maybe
we track confirm channels and non confirm channels separately.

###

publisherPoolSize = 1

Publisher         = require('./Publisher')
Consumer          = require('./Consumer')
TemporaryChannel  = require('./TemporaryChannel')

class ChannelManager
  constructor: (connection)->
    @connection = connection
    @channels   = @connection.channels

    @publisherConfirmChannels = []
    @publisherChannels        = []

    @tempChannel = null
    @queue    = null
    @exchange = null

    @channelCount = @connection.channelCount

  nextChannelNumber: () =>
    @channelCount++
    nextChannelNumber = @channelCount
    return nextChannelNumber

  publisherChannel: (confirm, cb)=>
    if typeof confirm is 'function'
      cb = confirm
      confirm = false

    if confirm
      pool = @publisherConfirmChannels
    else
      pool = @publisherChannels

    if pool.length < publisherPoolSize
      channel = @nextChannelNumber()
      p = new Publisher(@connection, channel, confirm)
      @channels[channel] = p
      pool.push p
      cb(null, p.channel)
    else
      i = Math.floor(Math.random() * pool.length)
      cb(null, pool[i].channel)

  temporaryChannel: (cb)=>
    if @tempChannel?
      cb?(null, @tempChannel)
      return @tempChannel

    channel = @nextChannelNumber()

    @tempChannel = new TemporaryChannel @connection, channel, (err, res)=>
      cb?(err, @tempChannel)

    @channels[channel] = @tempChannel
    return @tempChannel

  consumerChannel: (cb)->
    channel = @nextChannelNumber()
    s = new Consumer(@connection, channel)
    @channels[channel] = s

    cb(null, channel)


  channelReassign: (channel)->
    delete @channels[channel.channel]
    newChannelNumber = @nextChannelNumber()
    channel.channel  = newChannelNumber
    @channels[newChannelNumber] = channel

  channelClosed: (channelNumber)->
    delete @channels[channelNumber]

  isChannelClosed: (channelNumber)->
    return !@channels.hasOwnProperty(channelNumber)

module.exports = ChannelManager
