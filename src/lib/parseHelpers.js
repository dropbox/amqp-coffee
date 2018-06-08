const assert = require('assert');
const jspack = require('../jspack');
const { AMQPTypes } = require('./constants');

const parseIntFromBuffer = (buffer, size) => {
  switch (size) {
    case 1:
      return buffer[buffer.read++];

    case 2:
      return (buffer[buffer.read++] << 8) + buffer[buffer.read++];

    case 4:
      return (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) +
             (buffer[buffer.read++] << 8)  + buffer[buffer.read++];

    case 8:
      return (buffer[buffer.read++] << 56) + (buffer[buffer.read++] << 48) +
             (buffer[buffer.read++] << 40) + (buffer[buffer.read++] << 32) +
             (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) +
             (buffer[buffer.read++] << 8)  + buffer[buffer.read++];

    default:
      throw new Error('cannot parse ints of that size');
  }
};

const parseShortString = (buffer) => {
  const length = buffer[buffer.read++];
  const s = buffer.toString('utf8', buffer.read, buffer.read + length);
  buffer.read += length;
  return s;
};

const parseLongString = (buffer) => {
  const length = parseIntFromBuffer(buffer, 4);
  const s = buffer.slice(buffer.read, buffer.read + length);
  buffer.read += length;
  return s.toString();
}

const parseSignedInteger = (buffer) => {
  const int = parseIntFromBuffer(buffer, 4);
  if (int & 0x80000000) {
    int |= 0xEFFFFFFF;
    int = -int;
  }

  return int;
}

const parseTable = (buffer) => {
  const length = buffer.read + parseIntFromBuffer(buffer, 4);
  const table = {};

  while (buffer.read < length) {
    table[parseShortString(buffer)] = parseValue(buffer);
  }

  return table;
}

const TYPE_SELECTOR = Object.setPrototypeOf({
  [AMQPTypes.STRING]: parseLongString,
  [AMQPTypes.INTEGER]: buffer => parseIntFromBuffer(buffer, 4),
  [AMQPTypes.TIME]: buffer => (new Date()).setTime(parseIntFromBuffer(buffer, 8) * 1000),
  [AMQPTypes.HASH]: parseTable,
  [AMQPTypes.SIGNED_64BIT]: buffer => parseIntFromBuffer(buffer, 8),
  [AMQPTypes.BOOLEAN]: buffer => parseIntFromBuffer(buffer, 1) > 0,

  [AMQPTypes.DECIMAL]: (buffer) => {
    const dec = parseIntFromBuffer(buffer, 1);
    const num = parseIntFromBuffer(buffer, 4);
    return num / (dec * 10);
  },

  [AMQPTypes._64BIT_FLOAT]: (buffer) => {
    const b = [];
    for (let i = 0; i < 8; i += 1) {
      b[i] = buffer[buffer.read++];
    }

    return (new jspack(true)).Unpack('d', b);
  },

  [AMQPTypes._32BIT_FLOAT]: (buffer) => {
    const b = [];
    for (let i = 0; i < 4; i += 1) {
      b[i] = buffer[buffer.read++];
    }

    return (new jspack(true)).Unpack('f', b)
  },

  [AMQPTypes.BYTE_ARRAY]: (buffer) => {
    const len = parseIntFromBuffer(buffer, 4);
    const buf = Buffer.allocUnsafe(len);
    buffer.copy(buf, 0, buffer.read, buffer.read + len);
    buffer.read += len;
    return buf;
  },

  [AMQPTypes.ARRAY]: (buffer) => {
    const len = parseIntFromBuffer(buffer, 4);
    const end = buffer.read + len;
    const arr = new Array();

    while (buffer.read < end) {
      arr.push(parseValue(buffer));
    }

    return arr;
  },
}, null);

const FIELD_TYPE_SELECTOR = Object.setPrototypeOf({
  bit(ctx, buffer, i) {
    const fields = ctx.fields;
    const value = (buffer[buffer.read] & (1 << ctx.bitIndex)) ? true : false;
    if (fields[i + 1] && fields[i + 1].domain == 'bit') {
      ctx.bitIndex++;
    } else {
      ctx.bitIndex = 0;
      buffer.read++;
    }

    return value;
  },

  octet(ctx, buffer, i) {
    return buffer[buffer.read++];
  },

  short(ctx, buffer, i) {
    return parseIntFromBuffer(buffer, 2);
  },

  long(ctx, buffer, i) {
    return parseIntFromBuffer(buffer, 4);
  },

  timestamp(ctx, buffer, i) {
    return parseIntFromBuffer(buffer, 8);
  },

  longlong(ctx, buffer, i) {
    return parseIntFromBuffer(buffer, 8);
  },

  shortstr(ctx, buffer, i) {
    return parseShortString(buffer);
  },

  longstr(ctx, buffer, i) {
    return parseLongString(buffer);
  },

  table(ctx, buffer, i) {
    return parseTable(buffer);
  },

}, null);

const parseFields = (buffer, fields) => {
  const args = {};
  const ctx = { bitIndex: 0, fields };

  for (const [i, field] of fields.entries()) {
    const fn = FIELD_TYPE_SELECTOR[field.domain];
    assert(fn, "Unhandled parameter type " + field.domain);
    args[field.name] = fn(ctx, buffer, i);
  }

  return args;
}

const parseValue = (buffer) => {
  const fn = TYPE_SELECTOR[buffer[buffer.read++]];
  assert(fn, "Unknown field value type " + buffer[buffer.read - 1]);
  return fn(buffer);
};

module.exports = {
  parseIntFromBuffer,
  parseShortString,
  parseLongString,
  parseSignedInteger,
  parseTable,
  parseFields,
  parseValue,
};
