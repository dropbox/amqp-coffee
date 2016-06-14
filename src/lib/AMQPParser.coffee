# debug             = require('debug')('amqp:AMQPParser')
{EventEmitter}    = require('events')

{ Indicators, FrameType } = require('./config').constants
{ methodTable, classes, methods }         = require('./config').protocol
debug                                     = require('./config').debug('amqp:AMQPParser')


{parseIntFromBuffer, parseFields} = require('./parseHelpers')


class AMQPParser extends EventEmitter
  constructor: (version, type, connection) ->
    @connection = connection

    # send the start of the handshake....
    @connection.connection.write("AMQP" + String.fromCharCode(0,0,9,1));

    # set up some defaults, for reuse
    @frameHeader = new Buffer(7)
    @frameHeader.used = 0
    @frameHeader.length = @frameHeader.length

    # set the first step in out parser
    @parser = @header

  execute: (data)->
    # each parser will return the next parser for us to use.
    @parser = @parser(data)


  # Data Handlers ####################################################################
  header: (data)->
    dataLength = data.length
    neededForCompleteHeader = @frameHeader.length - @frameHeader.used

    # copy all of our data to our frame header
    data.copy(@frameHeader, @frameHeader.used, 0, dataLength)

    # update where we are in the header
    @frameHeader.used += dataLength

    # if we have all the header data we need we're done here
    if @frameHeader.used >= @frameHeader.length

      @frameHeader.read = 0 # this is used to keep track of where we are with parseIntFromBuffer

      # What do we know from the header packet.
      @frameType     = @frameHeader[@frameHeader.read++]
      @frameChannel  = parseIntFromBuffer(@frameHeader,2)
      @frameSize     = parseIntFromBuffer(@frameHeader,4)

      if @frameSize > @connection.frameMax
        return @error "Oversize frame #{@frameSize}"

      # # setup our frameBuffer
      @frameBuffer = new Buffer(@frameSize)
      @frameBuffer.used = 0

      # reset out frameHeader
      @frameHeader.used = 0
      return @frame(data.slice(neededForCompleteHeader))
    else
      return @header

  frame: (data)->
    dataLength = data.length

    neededForCompleteFrame = @frameBuffer.length - @frameBuffer.used

    data.copy(@frameBuffer, @frameBuffer.used, 0, dataLength)
    @frameBuffer.used += dataLength

    # we have everything we need AND more so lets make sure we pass that through
    if dataLength > neededForCompleteFrame
      return @frameEnd(data.slice(neededForCompleteFrame))

    # we have exactly what we need for this frame
    else if dataLength == neededForCompleteFrame
      return @frameEnd

    # we dont have enough info to continue so lets wait for more frame data
    else
      return @frame

  frameEnd: (data)->
    if !(data.length > 0) then return @frameEnd
    if data[0] != Indicators.FRAME_END
      return @error "Missing frame end marker"

    switch @frameType
      when FrameType.METHOD then @parseMethodFrame(@frameChannel, @frameBuffer)
      when FrameType.HEADER then @parseHeaderFrame(@frameChannel, @frameBuffer)
      when FrameType.BODY   then @parseContent(@frameChannel, @frameBuffer)

      when FrameType.HEARTBEAT
        @emit 'heartbeat'
      else
        @error "Unknown frametype #{@frameType}"

    return @header(data.slice(1))


  # Frame Parsers ################################################################
  parseMethodFrame: (channel, buffer)->
    buffer.read = 0
    classId  = parseIntFromBuffer(buffer, 2)
    methodId = parseIntFromBuffer(buffer, 2)

    if !methodTable[classId]? or !methodTable[classId][methodId]?
      return @error "bad classId, methodId pair: #{classId}, #{methodId}"

    method = methodTable[classId][methodId]
    args   = parseFields(buffer, method.fields)

    debug 3, ()->return "#{channel} > method #{method.name} #{JSON.stringify args}"
    @emit 'method', channel, method, args

  parseHeaderFrame: (channel, buffer)->
    buffer.read = 0

    classIndex = parseIntFromBuffer(buffer, 2)
    weight     = parseIntFromBuffer(buffer, 2)
    size       = parseIntFromBuffer(buffer, 8)

    classInfo     = classes[classIndex]
    propertyFlags = parseIntFromBuffer(buffer, 2)
    fields = []
    for field, i in classInfo.fields
      if (i + 1) % 15 is 0
        parseIntFromBuffer(buffer, 2)

      if propertyFlags & (1 << (15-(i%15)))
        fields.push field

    properties = parseFields(buffer, fields)

    debug 3, ()->return "#{channel} > contentHeader #{JSON.stringify properties} #{size}"
    @emit 'contentHeader', channel, classInfo, weight, properties, size

  parseContent: (channel, data)->
    debug 3, ()->return "#{channel} > content #{data.length}"
    @emit 'content', channel, data

  error: (error)->
    debug "Parser error #{error}"

    parserError = new Error(error)
    parserError.code = 'parser'

    @emit 'error', parserError
    @frameHeader.used = 0
    return @header

module.exports = AMQPParser



