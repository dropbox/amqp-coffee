# Channel
{EventEmitter} = require('events')

debug = require('./config').debug('amqp:Channel')
async = require('neo-async')
_     = require('lodash')

defaults = require('./defaults')
{ methodTable, classes, methods } = require('./config').protocol

CHANNEL_TIMEOUT = 2000
CHANNEL_CHECK   = 1000

if process.env.AMQP_TEST?
  CHANNEL_TIMEOUT = 200
  CHANNEL_CHECK   = 100

# we track this to avoid node's max stack size with a saturated async queue
OVERFLOW_PROTECTION = 0

class Channel extends EventEmitter
  constructor: (connection, channel)->

    @channel    = channel
    @connection = connection

    @state            = 'closed'
    @waitingCallbacks = {} # channel operations

    @queue   = async.queue(@_taskWorker, 1)

    @open()
    @transactional = false


  temporaryChannel: ()->
    @transactional     = true # THIS IS NOT AMQP TRANSACTIONS
    @lastChannelAccess = Date.now()

    if !@channelTracker?
      @channelTracker = setInterval ()=>
        if @lastChannelAccess < (Date.now() - CHANNEL_TIMEOUT)
          debug 4, ()->return "Closing channel due to inactivity"
          @close(true)
      , CHANNEL_CHECK

  open: (cb)->
    if @state is "closed"
      @state = 'opening'

      @waitForMethod(methods.channelOpenOk, cb) if cb?
      @connection._sendMethod(@channel, methods.channelOpen, {})
      @connection.channelCount++

      if @transactional then @temporaryChannel()
    else
      cb("state isn't closed.  not opening channel") if cb?

  reset: (cb)=>
    @_callOutstandingCallbacks("Channel Opening or Reseting")

    # if our state is closed and either we arn't a transactional channel (queue, exchange declare etc..)
    # or we're within our acceptable time window for this queue
    if @state is 'closed' and (!@transactional or @listeners('open').length > 0 or (@transactional and @lastChannelAccess > (Date.now() - CHANNEL_TIMEOUT)))
      debug 1, ()->return "State is closed... reconnecting"

      async.series [
        (next)=>
          @open(next)

        (next)=>
          @_onChannelReconnect(next)
      ], cb

    else
      cb() if cb?

  crash: (cb)=>
    if !process.env.AMQP_TEST?
      cb?()
      return true

    # this will crash a channel forcing a channelOpen from the server
    # this is really only for testing
    debug "Trying to crash channel"
    @connection._sendMethod @channel, methods.queuePurge, {queue:"idontexist"}
    @waitForMethod(methods.channelClose, cb) if cb?

  close: (auto)=>
    if !auto? or !auto then debug 1, ()->return "User requested channel close"

    clearInterval(@channelTracker)
    @channelTracker = null

    if @state is 'open'
      @connection.channelCount--
      @state = 'closed'
      @connection._sendMethod @channel, methods.channelClose, {
        replyText : 'Goodbye'
        replyCode : 200
        classId   : 0
        methodId  : 0
      }

  waitForMethod: (method, cb)->
    @waitingCallbacks[method.name] = [] if !@waitingCallbacks[method]?
    @waitingCallbacks[method.name].push cb

  callbackForMethod: (method)->
    if !method? or !@waitingCallbacks[method.name]?
      return ()-> return true

    cb = @waitingCallbacks[method.name].shift()
    if @waitingCallbacks[method.name].length is 0
      delete @waitingCallbacks[method.name]

    return cb


  # Functions to overwrite
  _channelOpen: ()->
    debug 4, ()->return "channel open called and should be overwritten"

  _channelClosed: ()->
    debug 4, ()->return "channel closed called and should be overwritten"

  _onChannelReconnect: (cb)->
    debug 4, ()->return "channel reconnect called and should be overwritten"
    cb()

  _onMethod: (method, args)->
    debug 3, ()->return "_onMethod MUST be overwritten by whoever extends Channel"


  # TASK QUEUEING ---------------------------------------------------------
  taskPush: ( method, args, okMethod, cb)=> # same as queueSendMethod
    @queue.push {type: 'method', method, args, okMethod, cb}

  taskQueuePushRaw: (task, cb)=>
    task.cb = cb if cb? and task?
    @queue.push task

  queueSendMethod: (method, args, okMethod, cb)=>
    @queue.push {type: 'method', method, args, okMethod, cb}

  queuePublish: (method, data, options)=>
    @queue.push {type: 'publish', method, data, options}

  _taskWorker: (task, done)=>
    if @transactional then @lastChannelAccess = Date.now()
    {type, method, okMethod, args, cb, data, options, preflight} = task

    doneFn = (err, res)->
      cb(err, res) if cb?
      if OVERFLOW_PROTECTION > 100
        OVERFLOW_PROTECTION = 0
        _.defer done
      else
        OVERFLOW_PROTECTION++
        done()

    # if preflight is false do not proceed
    if preflight? and !preflight()
      return doneFn('preflight check failed')

    if @state is 'closed' and @connection.state is 'open'
      debug 1, ()->return "Channel reassign"
      @connection.channelManager.channelReassign(@)
      @open (e, r)=>
        @_taskWorker(task, done)

    else if @state isnt 'open'
      # if our connection is closed that ok, but if its destroyed it will not reopen
      if @connection.state is 'destroyed'
        doneFn("Connection is destroyed")

      else
        if @connection.channelManager.isChannelClosed(@channel)
          @connection.channelManager.channelReassign(@)
        @once 'open', ()=>
          @_taskWorker(task, done)

    else
      @waitForMethod(okMethod, doneFn) if okMethod?

      if type is 'method'
        @connection._sendMethod(@channel, method, args)
        doneFn() if !okMethod?

      else if type is 'publish'
        @connection._sendMethod(@channel, method, options)
        @connection._sendBody @channel, data, options, (err, res)->
        doneFn() if !okMethod?

      else
        throw new Error("a task was queue with an unknown type of #{type}")


  _callOutstandingCallbacks: (message)=>
    outStandingCallbacks = @waitingCallbacks
    @waitingCallbacks    = {}

    if !message? then message = "Channel Unavaliable"
    for key, cbs of outStandingCallbacks
      for cb in cbs
        cb?(message)


  # incomming channel messages for us
  _onChannelMethod: (channel, method, args )->
    if @transactional then @lastChannelAccess = Date.now()

    if channel isnt @channel
      return debug 1, ()->return ["channel was sent to the wrong channel object", channel, @channel]

    @callbackForMethod(method)(null, args)

    switch method
      when methods.channelCloseOk
        @connection.channelManager.channelClosed(@channel)

        @state = 'closed'

        @_channelClosed("Channel closed")
        @_callOutstandingCallbacks({msg: "Channel closed"})

      when methods.channelClose
        @connection.channelManager.channelClosed(channel)

        debug 1, ()->return "Channel closed by server #{JSON.stringify args}"
        @state = 'closed'

        if args.classId? and args.methodId?
          closingMethod = methodTable[args.classId][args.methodId].name
          @callbackForMethod(methods["#{closingMethod}Ok"])(args) #this would be the error

        @_channelClosed({msg: "Server closed channel", error: args})
        @_callOutstandingCallbacks("Channel closed by server #{JSON.stringify args}")

      when methods.channelOpenOk
        @state = 'open'
        @_channelOpen()
        @emit 'open'


      else
        @_onMethod( channel, method, args )

  _connectionClosed: ()->
    # if the connection closes, make sure we reflect that because that channel is also closed
    if @state isnt 'closed'
      @state = 'closed'
      @_channelClosed()
      if @channelTracker?
        clearInterval(@channelTracker)
        @channelTracker = null

module.exports = Channel
