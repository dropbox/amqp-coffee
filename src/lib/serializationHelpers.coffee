jspack = require('../jspack')

exports.serializeFloat = serializeFloat = (b, size, value, bigEndian)->
  jp = new jspack(bigEndian)

  switch size
    when 4
      x = jp.Pack('f', [value])
      for i in x
        b[b.used++] = i

    when 8
      x = jp.Pack('d', [value])
      for i in x
        b[b.used++] = i

    else
      throw new Error("Unknown floating point size")


exports.serializeInt = serializeInt = (b, size, int)->
  if (b.used + size > b.length)
    throw new Error("write out of bounds")

  # Only 4 cases - just going to be explicit instead of looping.
  switch size
    # octet
    when 1
      b[b.used++] = int

    # short
    when 2
      b[b.used++] = (int & 0xFF00) >> 8
      b[b.used++] = (int & 0x00FF) >> 0

    # long
    when 4
      b[b.used++] = (int & 0xFF000000) >> 24
      b[b.used++] = (int & 0x00FF0000) >> 16
      b[b.used++] = (int & 0x0000FF00) >> 8
      b[b.used++] = (int & 0x000000FF) >> 0


    # long long
    when 8
      b[b.used++] = (int & 0xFF00000000000000) >> 56
      b[b.used++] = (int & 0x00FF000000000000) >> 48
      b[b.used++] = (int & 0x0000FF0000000000) >> 40
      b[b.used++] = (int & 0x000000FF00000000) >> 32
      b[b.used++] = (int & 0x00000000FF000000) >> 24
      b[b.used++] = (int & 0x0000000000FF0000) >> 16
      b[b.used++] = (int & 0x000000000000FF00) >> 8
      b[b.used++] = (int & 0x00000000000000FF) >> 0

    else
      throw new Error("Bad size")


exports.serializeShortString = serializeShortString = (b, string)->
  if (typeof(string) != "string")
    throw new Error("param must be a string")

  byteLength = Buffer.byteLength(string, 'utf8')
  if (byteLength > 0xFF)
    throw new Error("String too long for 'shortstr' parameter")

  if (1 + byteLength + b.used >= b.length)
    throw new Error("Not enough space in buffer for 'shortstr'")

  b[b.used++] = byteLength
  b.write(string, b.used, 'utf8')
  b.used += byteLength


exports.serializeLongString = serializeLongString = (b, string)->
  # we accept string, object, or buffer for this parameter.
  # in the when of string we serialize it to utf8.
  if (typeof(string) == 'string')
    byteLength = Buffer.byteLength(string, 'utf8')
    serializeInt(b, 4, byteLength)
    b.write(string, b.used, 'utf8')
    b.used += byteLength
  else if (typeof(string) == 'object')
    serializeTable(b, string)
  else
    # data is Buffer
    byteLength = string.length
    serializeInt(b, 4, byteLength)
    b.write(string, b.used) # memcpy
    b.used += byteLength

exports.serializeDate = serializeDate = (b, date)->
  serializeInt(b, 8, date.valueOf() / 1000)

exports.serializeBuffer = serializeBuffer = (b, buffer)->
  serializeInt(b, 4, buffer.length)
  buffer.copy(b, b.used, 0)
  b.used += buffer.length

exports.serializeBase64 = serializeBase64 = (b, buffer)->
  serializeLongString(b, buffer.toString('base64'))


exports.serializeValue = serializeValue = (b, value)->
  switch typeof(value)
    when 'string'
      b[b.used++] = 'S'.charCodeAt(0)
      serializeLongString(b, value)

    when 'number'
      if !isFloat(value)
        if isBigInt(value)
          # 64-bit uint
          b[b.used++] = 'l'.charCodeAt(0)
          serializeInt(b, 8, value)
        else
          #32-bit uint
          b[b.used++] = 'I'.charCodeAt(0)
          serializeInt(b, 4, value)

      else
        #64-bit float
        b[b.used++] = 'd'.charCodeAt(0)
        serializeFloat(b, 8, value)


    when 'boolean'
      b[b.used++] = 't'.charCodeAt(0)
      b[b.used++] = value

    else
      if value instanceof Date
        b[b.used++] = 'T'.charCodeAt(0)
        serializeDate(b, value)
      else if value instanceof Buffer
        b[b.used++] = 'x'.charCodeAt(0)
        serializeBuffer(b, value)
      else if Array.isArray(value)
        b[b.used++] = 'A'.charCodeAt(0)
        serializeArray(b, value)
      else if typeof(value) == 'object'
        b[b.used++] = 'F'.charCodeAt(0)
        serializeTable(b, value)
      else
        this.throwError("unsupported type in amqp table = " + typeof(value))



exports.serializeTable = serializeTable = (b, object)->
  if (typeof(object) != "object")
    throw new Error("param must be an object")


  # Save our position so that we can go back and write the length of this table
  # at the beginning of the packet (once we know how many entries there are).
  lengthIndex = b.used
  b.used += 4 # sizeof long
  startIndex = b.used

  for key, value of object
    serializeShortString(b, key)
    serializeValue(b, value)

  endIndex = b.used
  b.used = lengthIndex
  serializeInt(b, 4, endIndex - startIndex)
  b.used = endIndex


exports.serializeArray = serializeArray = (b, arr)->
  # Save our position so that we can go back and write the byte length of this array
  # at the beginning of the packet (once we have serialized all elements).
  lengthIndex = b.used
  b.used += 4 # sizeof long
  startIndex = b.used

  for i in arr
    serializeValue(b, i)

  endIndex = b.used
  b.used = lengthIndex
  serializeInt(b, 4, endIndex - startIndex)
  b.used = endIndex


exports.serializeFields = serializeFields = (buffer, fields, args, strict)->
  bitField = 0
  bitIndex = 0
  for i in [0...fields.length]
    field = fields[i]
    domain = field.domain
    if !(args.hasOwnProperty(field.name))
      if strict
        if field.name.indexOf("reserved") is 0

          # populate default reserved values, this is to keep the code cleaner, but may be wrong
          switch domain
            when 'short'     then args[field.name] = 0
            when 'bit'       then args[field.name] = false
            when 'shortstr'  then args[field.name] = ""
            else args[field.name] = true
        else if field.name is "noWait"
          # defaults noWait to false
          args[field.name] = false
        else
          throw new Error("Missing field '" + field.name + "' of type '" + domain + "' while executing AMQP method '" + arguments.callee.caller.arguments[1].name + "'")
      else
        continue

    param = args[field.name]
    switch domain
      when 'bit'
        if (typeof(param) != "boolean")
          throw new Error("Unmatched field " + JSON.stringify(field))


        if param then bitField |= (1 << bitIndex)
        bitIndex++

        if (!fields[i+1] || fields[i+1].domain != 'bit')
          # debug('SET bit field ' + field.name + ' 0x' + bitField.toString(16))
          buffer[buffer.used++] = bitField
          bitField = 0
          bitIndex = 0


      when 'octet'
        if (typeof(param) != "number" || param > 0xFF)
          throw new Error("Unmatched field " + JSON.stringify(field))

        buffer[buffer.used++] = param

      when 'short'
        if (typeof(param) != "number" || param > 0xFFFF)
          throw new Error("Unmatched field " + JSON.stringify(field))

        serializeInt(buffer, 2, param)
        break

      when 'long'
        if (typeof(param) != "number" || param > 0xFFFFFFFF)
          throw new Error("Unmatched field " + JSON.stringify(field))

        serializeInt(buffer, 4, param)

      when 'timestamp', 'longlong'
        serializeInt(buffer, 8, param)

      when 'shortstr'
        if (typeof(param) != "string" || param.length > 0xFF)
          throw new Error("Unmatched field " + JSON.stringify(field))

        serializeShortString(buffer, param)

      when 'longstr'
        serializeLongString(buffer, param)

      when 'table'
        if (typeof(param) != "object")
          throw new Error("Unmatched field " + JSON.stringify(field))

        serializeTable(buffer, param)

      else
        throw new Error("Unknown domain value type " + domain)


exports.isBigInt = isBigInt = (value)->
  return value > 0xffffffff


exports.getCode = getCode = (dev)->
  hexArray = "0123456789ABCDEF".split('')

  code1 = Math.floor(dec / 16)
  code2 = dec - code1 * 16
  return hexArray[code2]


exports.isFloat = isFloat = (value)->
  return value is +value and value isnt value|0

