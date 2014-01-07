{ AMQPTypes } = require('./constants')

module.exports =
  parseIntFromBuffer : (buffer, size) ->
    switch size
      when 1
        return buffer[buffer.read++]

      when 2
        return (buffer[buffer.read++] << 8) + buffer[buffer.read++]

      when 4
        return (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) +
               (buffer[buffer.read++] << 8)  + buffer[buffer.read++]

      when 8
        return (buffer[buffer.read++] << 56) + (buffer[buffer.read++] << 48) +
               (buffer[buffer.read++] << 40) + (buffer[buffer.read++] << 32) +
               (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) +
               (buffer[buffer.read++] << 8)  + buffer[buffer.read++]

      else
        throw new Error("cannot parse ints of that size")

  parseTable : (buffer)->
    length = buffer.read + module.exports.parseIntFromBuffer(buffer, 4)
    table = {}

    while (buffer.read < length)
      table[module.exports.parseShortString(buffer)] = module.exports.parseValue(buffer)

    return table


  parseFields: (buffer, fields)->
    args = {};

    bitIndex = 0;

    for field, i in fields
      #debug("parsing field " + field.name + " of type " + field.domain);
      switch field.domain
        when 'bit'
          # 8 bits can be packed into one octet.
          # XXX check if bitIndex greater than 7?

          value = (buffer[buffer.read] & (1 << bitIndex)) ? true : false;

          if (fields[i+1] && fields[i+1].domain == 'bit')
            bitIndex++;

          else
            bitIndex = 0;
            buffer.read++;

        when 'octet'
          value = buffer[buffer.read++];

        when 'short'
          value = module.exports.parseIntFromBuffer(buffer, 2)

        when 'long'
          value = module.exports.parseIntFromBuffer(buffer, 4)

        when 'timestamp', 'longlong'
          value = module.exports.parseIntFromBuffer(buffer, 8)

        when 'shortstr'
          value = module.exports.parseShortString(buffer)


        when 'longstr'
          value = module.exports.parseLongString(buffer)


        when 'table'
          value = module.exports.parseTable(buffer)


        else
          throw new Error("Unhandled parameter type " + field.domain);

      #debug("got " + value);
      args[field.name] = value;

    return args;

  parseShortString: (buffer)->
    length = buffer[buffer.read++]
    s = buffer.toString('utf8', buffer.read, buffer.read + length)
    buffer.read += length
    return s

  parseLongString: (buffer)->
    length = module.exports.parseIntFromBuffer(buffer, 4)
    s = buffer.slice(buffer.read, buffer.read + length)
    buffer.read += length
    return s.toString()

  parseSignedInteger: (buffer)->
    int = module.exports.parseIntFromBuffer(buffer, 4)
    if (int & 0x80000000)
      int |= 0xEFFFFFFF
      int = -int
    return int


  parseValue: (buffer)->
    switch (buffer[buffer.read++])
      when AMQPTypes.STRING
        return module.exports.parseLongString(buffer);

      when AMQPTypes.INTEGER
        return module.exports.parseIntFromBuffer(buffer, 4);

      when AMQPTypes.DECIMAL
        dec = module.exports.parseIntFromBuffer(buffer, 1);
        num = module.exports.parseIntFromBuffer(buffer, 4);
        return num / (dec * 10);

      when AMQPTypes._64BIT_FLOAT
        b = [];
        for i in [0...8]
          b[i] = buffer[buffer.read++];

        return (new jspack(true)).Unpack('d', b);

      when AMQPTypes._32BIT_FLOAT
        b = [];
        for i in [0...4]
          b[i] = buffer[buffer.read++];

        return (new jspack(true)).Unpack('f', b);

      when AMQPTypes.TIME
        int = module.exports.parseIntFromBuffer(buffer, 8);
        return (new Date()).setTime(int * 1000);

      when AMQPTypes.HASH
        return module.exports.parseTable(buffer);

      when AMQPTypes.SIGNED_64BIT
        return module.exports.parseIntFromBuffer(buffer, 8);

      when AMQPTypes.BOOLEAN
        return (module.exports.parseIntFromBuffer(buffer, 1) > 0);

      when AMQPTypes.BYTE_ARRAY
        len = module.exports.parseIntFromBuffer(buffer, 4);
        buf = new Buffer(len);
        buffer.copy(buf, 0, buffer.read, buffer.read + len);
        buffer.read += len;
        return buf;

      when AMQPTypes.ARRAY
        len = module.exports.parseIntFromBuffer(buffer, 4);
        end = buffer.read + len;
        arr = new Array();

        while (buffer.read < end)
          arr.push(module.exports.parseValue(buffer));

        return arr;

      else
        throw new Error("Unknown field value type " + buffer[buffer.read-1]);


