debug               = require('./config').debug('amqp:Connection')

{EventEmitter}      = require('events')
net                 = require('net')
_                   = require('underscore')
async               = require('async')

defaults                                                  = require('./defaults')
{ methodTable, classes, methods }                         = require('./config').protocol
{ MaxFrameBuffer, FrameType, HeartbeatFrame, EndFrame }   = require('./config').constants
{ serializeInt, serializeFields }                         = require('./serializationHelpers')

Queue           = require('./Queue')
Exchange        = require('./Exchange')
AMQPParser      = require('./AMQPParser')
ChannelManager  = require('./ChannelManager')


if process.env.AMQP_TEST?
  defaults.connection.reconnectDelayTime = 100


class Connection extends EventEmitter

  ###

    host: localhost | [localhost, localhost] | [{host: localhost, port: 5672}, {host: localhost, port: 5673}]
    port: int
    vhost: %2F
    hostRandom: default false, if host is an array

    @state : opening | open | closed | reconnecting | destroyed

  ###
  constructor: (args, cb)->
    @id = Math.round(Math.random() * 1000)

    if typeof args is 'function'
      cb = args
      args = {}

    # this is the main connect event
    cb = _.once cb if cb?
    @state = 'opening'

    @connectionOptions = _.defaults args, defaults.connection

    # setup our defaults
    @channelCount = 0

    @channels   = {0:this}
    @queues     = {}
    @exchanges  = {}

    @sendBuffer = new Buffer(MaxFrameBuffer)

    @channelManager = new ChannelManager(@)

    async.series [

      (next)=>
        # determine to host to connect to if we have an array of hosts
        if !Array.isArray(@connectionOptions.host)
          @connectionOptions.host = [@connectionOptions.host]

        @connectionOptions.hosts = @connectionOptions.host.map (uri)=>
          if uri.port? and uri.host?
            return {host: uri.host.toLowerCase(), port: parseInt(uri.port)}

          # our host name has a : and theat implies a uri with host and port
          else if typeof(uri) is 'string' and uri.indexOf(":") isnt -1
            [host, port] = uri.split(":")
            return {host: host.toLowerCase(), port: parseInt(port)}

          else if typeof(uri) is 'string'
            return {host: uri.toLowerCase(), port: @connectionOptions.port}

          else
            throw new Error("we dont know what do do with the host #{uri}")

        @connectionOptions.hosti = 0

        if @connectionOptions.hostRandom
          @connectionOptions.hosti = Math.floor(Math.random() * @connectionOptions.hosts.length)

        @updateConnectionOptionsHostInformation()
        next()


      (next)=>
        if @connectionOptions.rabbitMasterNode?.queue?
          require('./plugins/rabbit').masterNode @, @connectionOptions.rabbitMasterNode.queue, next
        else
          next()

      (next)=>
        if @connection then @connection.removeAllListeners()

        @connection = net.connect @connectionOptions.port, @connectionOptions.host
        @connection.once 'connect', ()=> @_connectedFirst()
        @connection.on   'connect', ()=> @_connected()

        if @connectionOptions.connectTimeout? and !@connectionOptions.reconnect
          clearTimeout(@_connectTimeout)

          @_connectTimeout = setTimeout ()=>
            debug 1, ()-> return "Connection timeout triggered"
            @close()
            cb?({code:'T', message:'Connection Timeout', host:@connectionOptions.host, port:@connectionOptions.port})
          , @connectionOptions.connectTimeout

        @connection.on 'error', (e, r)=>
          if @state isnt 'destroyed'
            debug 1, ()=> return ["Connection Error ", e, r, @connectionOptions.host]

          # if we are to keep trying we wont callback until we're sucessfull, or we've hit a timeout.
          if !@connectionOptions.reconnect
            if cb?
              cb(e,r)
            else
              @emit 'error', e

        @connection.on 'close', (had_error)=>
          clearTimeout(@_connectTimeout)
          @emit 'close' if @state is "open"

          if @state isnt 'destroyed'
            if !@connectionOptions.reconnect
              debug 1, ()-> return "Connection closed not reconnecting..."
              return

            @state = 'reconnecting'
            debug 1, ()-> return "Connection closed reconnecting..."

            _.delay ()=>
              # rotate hosts if we have multiple hosts
              if @connectionOptions.hosts.length > 1
                @connectionOptions.hosti = (@connectionOptions.hosti + 1) % @connectionOptions.hosts.length
                @updateConnectionOptionsHostInformation()

              @connection.connect @connectionOptions.port, @connectionOptions.host
            , @connectionOptions.reconnectDelayTime

        next()
    ], (e, r)->
      if e? and cb?
        cb(e)

    if cb? then @once 'ready', cb
    @on 'close', @_closed

    super()
    return @

  updateConnectionOptionsHostInformation: ()=>
    @connectionOptions.host  = @connectionOptions.hosts[@connectionOptions.hosti].host
    @connectionOptions.port  = @connectionOptions.hosts[@connectionOptions.hosti].port

  # User called functions
  queue: (args, cb)->
    if !cb? or typeof(cb) isnt 'function'
      return new Queue( @channelManager.temporaryChannel() , args)

    else
      @channelManager.temporaryChannel (err, channel)->
        if err? then return cb err
        q = new Queue(channel, args, cb)


  exchange: (args, cb)->
    if !cb? or typeof(cb) isnt 'function'
      return new Exchange(@channelManager.temporaryChannel(), args)

    else
      @channelManager.temporaryChannel (err, channel)->
        if err? then return cb err
        e = new Exchange(channel, args, cb)

  consume: (queueName, options, messageParser, cb)->
    @channelManager.consumerChannel (err, channel)=>
      consumerChannel = @channels[channel] if !err?

      if err? or !consumerChannel? then return cb({err, channel})
      consumerChannel.consume(queueName, options, messageParser, cb)

  # channel is optional!
  publish: (exchange, routingKey, data, options, cb)=>
    if cb? and options.confirm # there is no point to confirm without a callback
      confirm = true
    else
      confirm = false

    @channelManager.publisherChannel confirm, (err, channel)=>
      publishChannel = @channels[channel] if !err?
      #TODO figure out error messages
      if err? or !publishChannel? then return cb({err, channel})

      publishChannel.publish exchange, routingKey, data, options, cb


  close: ()=>
    # should close all the things and reset for a new clean guy
    # @connection.removeAllListeners() TODO evaluate this
    @_clearHeartbeatTimer()

    _.defer ()=>
      @state = 'destroyed'

      # nice close, something for the future
      # @_sendMethod 0, methods.connectionClose, {classId:0, methodId: 0, replyCode:200, replyText:'closed'}

      @connection.destroy()

  # TESTING OUT OF ORDER OPERATION
  crashOOO: ()=>
    if !process.env.AMQP_TEST? then return true
    # this will crash a channel forcing an out of order operation
    debug "Trying to crash connection by an oow op"
    @_sendBody @channel, new Buffer(100), {}

  # Service Called Functions
  _connectedFirst: ()=>
    debug 1, ()=> return "Connected to #{@connectionOptions.host}:#{@connectionOptions.port}"

  _connected: ()->
    clearTimeout(@_connectTimeout)
    @_resetHeartbeatTimer()
    @_setupParser(@_reestablishChannels)

  _reestablishChannels: ()=>
    async.forEachSeries _.keys(@channels), (channel, done)=>
      if channel is "0" then done() else
        @channels[channel].reset done


  _closed: ()=>
    @_clearHeartbeatTimer()

  # we should expect a heartbeat at least once every heartbeat interval x 2
  # we should reset this timer every time we get a heartbeat

  # on initial connection we should start expecting heart beats
  # on disconnect or close we should stop expecting these.
  # on heartbeat recieved we should expect another
  _heartbeat: ()=>
    debug 4, ()=> return "♥ heartbeat"
    @connection.write HeartbeatFrame
    @_resetHeartbeatTimer()

  _resetHeartbeatTimer: ()=>
    debug 6, ()=> return "_resetHeartbeatTimer"
    clearInterval @heartbeatTimer
    @heartbeatTimer = setInterval @_missedHeartbeat, @connectionOptions.heartbeat * 2

  _clearHeartbeatTimer: ()=>
    debug 6, ()=> return "_clearHeartbeatTimer"
    clearInterval @heartbeatTimer

  # called directly in tests to simulate missed heartbeat
  _missedHeartbeat: ()=>
    if @state is 'open'
      debug 1, ()-> return "We missed a heartbeat, destroying the connection."
      @connection.destroy()

    @_clearHeartbeatTimer()

  _setupParser: (cb)->
    if @parser? then @parser.removeAllListeners()

    # setup the parser
    @parser = new AMQPParser('0-9-1', 'client', @connection)

    @parser.on 'method',         @_onMethod
    @parser.on 'contentHeader',  @_onContentHeader
    @parser.on 'content',        @_onContent
    @parser.on 'heartbeat',      @_heartbeat

    # network --> parser
    # send any connection data events to our parser
    @connection.removeAllListeners('data') # cleanup reconnections
    @connection.on 'data', (data)=> @parser.execute data

    if cb?
      @removeListener('ready', cb)
      @once 'ready', cb

  _sendMethod: (channel, method, args)=>
    if channel isnt 0 and @state in ['opening', 'reconnecting']
      return @once 'ready', ()=>
        @_sendMethod(channel, method, args)


    debug 3, ()-> return "#{channel} < #{method.name} #{JSON.stringify args}"
    b = @sendBuffer

    b.used = 0

    b[b.used++] = 1 # constants. FrameType.METHOD
    serializeInt(b, 2, channel)

    # will replace with actuall length later
    lengthIndex = b.used
    serializeInt(b, 4, 0)
    startIndex = b.used

    serializeInt(b, 2, method.classIndex);  # short, classId
    serializeInt(b, 2, method.methodIndex); # short, methodId

    serializeFields(b, method.fields, args, true);

    endIndex = b.used

    # write in the frame length now that we know it.
    b.used = lengthIndex
    serializeInt(b, 4, endIndex - startIndex);
    b.used = endIndex

    b[b.used++] = 206; # constants Indicators.frameEnd;

    # we create this new buffer to make sure it doesn't get overwritten in a situation where we're backed up flushing to the network
    methodBuffer = new Buffer(b.used)
    b.copy(methodBuffer,0 ,0 ,b.used)
    @connection.write(methodBuffer)

  # Only used in sendBody
  _sendHeader: (channel, size, args)=>
    debug 3, ()=> return "#{@id} #{channel} < header #{size} #{JSON.stringify args}"
    b = @sendBuffer

    classInfo = classes[60]

    b.used = 0
    b[b.used++] = 2 # constants. FrameType.HEADER

    serializeInt(b, 2, channel)

    lengthStart = b.used
    serializeInt(b, 4, 0) # temporary length
    bodyStart   = b.used

    serializeInt(b, 2, classInfo.index) # class 60 for Basic
    serializeInt(b, 2, 0)               # weight, always 0 for rabbitmq
    serializeInt(b, 8, size)            # byte size of body

    #properties - first propertyFlags
    propertyFlags  = [0]
    propertyFields = []

    ###
    The property flags are an array of bits that indicate the presence or absence of each
    property value in sequence. The bits are ordered from most high to low - bit 15 indicates
    the first property.

    The property flags can specify more than 16 properties. If the last bit (0) is set, this indicates that a
    further property flags field follows. There are many property flags fields as needed.
    ###
    for field, i in classInfo.fields
      if (i + 1)  % 16 is 0
        # we have more than 15 properties, set bit 0 to 1 of the previous bit set
        propertyFlags[Math.floor((i-1)/15)] |= 1 << 0
        propertyFlags.push 0

      if args[field.name]
        propertyFlags[Math.floor(i/15)] |= 1 <<(15-i)

    for propertyFlag in propertyFlags
      serializeInt(b, 2, propertyFlag)

    #now the actual properties.
    serializeFields(b, classInfo.fields, args, false)

    #serializeTable(b, props);
    bodyEnd = b.used;

    # Go back to the header and write in the length now that we know it.
    b.used = lengthStart;
    serializeInt(b, 4, bodyEnd - bodyStart)
    b.used = bodyEnd;

    # 1 OCTET END
    b[b.used++] = 206 # constants.frameEnd;

    # we create this new buffer to make sure it doesn't get overwritten in a situation where we're backed up flushing to the network
    headerBuffer = new Buffer(b.used)
    b.copy(headerBuffer,0 ,0 ,b.used)
    @connection.write(headerBuffer)

  _sendBody: (channel, body, args, cb)=>
    if body instanceof Buffer
      @_sendHeader channel, body.length, args

      offset = 0
      while offset < body.length

        length = Math.min((body.length - offset), MaxFrameBuffer)
        h      = new Buffer(7)
        h.used = 0

        h[h.used++] = 3                     # constants.frameBody
        serializeInt(h, 2, channel)
        serializeInt(h, 4, length)

        debug 3, ()=> return "#{@id} #{channel} < body #{offset}, #{offset+length} of #{body.length}"
        @connection.write(h)
        @connection.write(body.slice(offset,offset+length))
        @connection.write(EndFrame)

        offset += MaxFrameBuffer

      cb?()
      return true
    else
      debug 1, ()-> return "invalid body type"
      cb?("Invalid body type for publish, expecting a buffer")
      return false

  _onContentHeader: (channel, classInfo, weight, properties, size)=>
    @_resetHeartbeatTimer()
    channel = @channels[channel]
    if channel?._onContentHeader?
      channel._onContentHeader(channel, classInfo, weight, properties, size)
    else
      debug 1, ()-> return ["unhandled -- _onContentHeader #{channel} > ", {classInfo, properties, size}]

  _onContent: (channel, data)=>
    @_resetHeartbeatTimer()
    channel = @channels[channel]
    if channel?._onContent?
      channel._onContent(channel, data)
    else
      debug 1, ()-> return "unhandled -- _onContent #{channel} > #{data.length}"


  _onMethod: (channel, method, args)=>
    @_resetHeartbeatTimer()
    if channel > 0
      # delegate to correct channel
      if !@channels[channel]?
        return debug 1, ()-> return "Recieved a message on untracked channel #{channel}, #{method.name} #{JSON.stringify args}"
      if !@channels[channel]._onChannelMethod?
        return debug 1, ()-> return "Channel #{channel} has no _onChannelMethod"
      @channels[channel]._onChannelMethod(channel, method, args)


    else
      # connection methods for channel 0
      switch method
        when methods.connectionStart
          if args.versionMajor != 0 and args.versionMinor!=9
            @emit 'error', new Error("Bad server version")
            return
          # set our server properties up
          @serverProperties = args.serverProperties
          @_sendMethod 0, methods.connectionStartOk, {
            clientProperties: @connectionOptions.clientProperties
            mechanism:    'AMQPLAIN'
            response:{
              LOGIN:      @connectionOptions.login
              PASSWORD:   @connectionOptions.password
            }
            locale: 'en_US'
          }
        when methods.connectionTune
          @_sendMethod 0, methods.connectionTuneOk, {
            channelMax: 0
            frameMax: MaxFrameBuffer
            heartbeat: @connectionOptions.heartbeat / 1000
          }

          @_sendMethod 0, methods.connectionOpen, {
            virtualHost: @connectionOptions.vhost
          }

        when methods.connectionOpenOk
          @state = 'open'
          @emit 'ready'

        when methods.connectionClose
          @state = 'closed'
          @_sendMethod 0, methods.connectionCloseOk, {}

          e = new Error(args.replyText)
          e.code = args.replyCode
          @emit 'close', e

        when methods.connectionCloseOk
          @emit 'close'
          @connection.destroy()

        else
          debug 1, ()-> return "0 < no matched method on connection for #{method.name}"

module.exports = Connection
