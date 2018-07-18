// tslint:disable:object-literal-sort-keys
import assert = require('assert');
import { Buffer } from 'buffer';
import {
  AMQPTypes,
  FrameType,
  INDICATOR_FRAME_END,
  InterfaceProtocol,
  kMissingFrame,
  kUnknownFrameType,
} from './constants';
import { classes, InterfaceField, InterfaceMethodsTableMethod, methodTable } from './protocol';

export interface InterfaceConfiguration {
  handleResponse: InterfaceHandleResponse;
}

type InterfaceHandleResponse = (channel: number, datum: InterfaceProtocol | Error) => void;

const HEADER_SIZE = 7;
const FIELD_TYPE_SELECTOR = Object.setPrototypeOf({
  bit(parser: Parser, nextField?: InterfaceField): boolean {
    const value = ((parser.buffer as Buffer)[parser.offset] & (1 << parser.bitIndex))
      ? true
      : false;

    if (nextField !== undefined && nextField.domain === 'bit') {
      parser.bitIndex += 1;
    } else {
      parser.bitIndex = 0;
      parser.offset += 1;
    }

    return value;
  },
  octet: parseInt1,
  short: parseInt2,
  long: parseInt4,
  timestamp: parseInt8,
  longlong: parseInt8,
  shortstr: parseShortString,
  longstr: parseLongString,
  table: parseTable,
}, null);

const TYPE_SELECTOR = Object.setPrototypeOf({
  [AMQPTypes.STRING]: parseLongString,
  [AMQPTypes.INTEGER]: parseInt4,
  [AMQPTypes.TIME]: (parser: Parser) => new Date(parseInt8(parser) * 1000),
  [AMQPTypes.HASH]: parseTable,
  [AMQPTypes.SIGNED_64BIT]: parseInt8,
  [AMQPTypes.BOOLEAN]: (parser: Parser) => parseInt1(parser) > 0,
  [AMQPTypes.DECIMAL](parser: Parser) {
    const dec = parseInt1(parser) * 10;
    const num = parseInt4(parser);
    return num / dec;
  },
  [AMQPTypes._64BIT_FLOAT](parser: Parser) {
    const value = (parser.buffer as Buffer).readDoubleBE(parser.offset);
    parser.offset += 8;
    return value;
  },
  [AMQPTypes._32BIT_FLOAT](parser: Parser) {
    const value = (parser.buffer as Buffer).readFloatBE(parser.offset);
    parser.offset += 4;
    return value;
  },
  [AMQPTypes.BYTE_ARRAY](parser: Parser) {
    const len = parseInt4(parser);
    const buf = Buffer.allocUnsafe(len);
    (parser.buffer as Buffer).copy(buf, 0, parser.offset, parser.offset + len);
    parser.offset += len;
    return buf;
  },
  [AMQPTypes.ARRAY](parser: Parser) {
    const len = parseInt4(parser);
    const end = parser.offset + len;
    const arr = new Array();

    while (parser.offset < end) {
      arr.push(parseValue(parser));
    }

    return arr;
  },
}, null);

function parseInt1(parser: Parser): number {
  return (parser.buffer as Buffer)[parser.offset++];
}

function parseInt2(parser: Parser): number {
  const offset = parser.offset;
  const buffer = parser.buffer as Buffer;
  parser.offset = offset + 2;
  return (buffer[offset] << 8) + buffer[offset + 1];
}

function parseInt4(parser: Parser): number {
  const offset = parser.offset;
  const buffer = parser.buffer as Buffer;
  parser.offset = offset + 4;
  return (buffer[offset] << 24) + (buffer[offset + 1] << 16) +
         (buffer[offset + 2] << 8) + buffer[offset + 3];
}

function parseInt8(parser: Parser): number {
  const offset = parser.offset;
  const buffer = parser.buffer as Buffer;
  parser.offset = offset + 8;
  return (buffer[offset + 1] << 56) + (buffer[offset + 2] << 48) +
         (buffer[offset + 3] << 40) + (buffer[offset + 4] << 32) +
         (buffer[offset + 5] << 24) + (buffer[offset + 6] << 16) +
         (buffer[offset + 7] << 8)  + buffer[offset + 8];
}

function parseShortString(parser: Parser): string {
  const buffer = parser.buffer as Buffer;
  const length = buffer[parser.offset++];
  const offset = parser.offset;
  const nextOffset = offset + length;
  const s = buffer.toString('utf8', offset, nextOffset);
  parser.offset = nextOffset;
  return s;
}

function parseLongString(parser: Parser): string {
  const length = parseInt4(parser);
  const offset = parser.offset;
  const nextOffset = offset + length;
  const s = (parser.buffer as Buffer).toString('utf8', offset, nextOffset);
  parser.offset = nextOffset;
  return s;
}

function parseValue(parser: Parser) {
  return TYPE_SELECTOR[(parser.buffer as Buffer)[parser.offset++]](parser);
}

function parseTable(parser: Parser) {
  const length = parseInt4(parser);
  const endOfTable = parser.offset + length - 4;
  const table = Object.create(null);

  while (parser.offset < endOfTable) {
    table[parseShortString(parser)] = parseValue(parser);
  }

  return table;
}

function parseFields(parser: Parser, fields: InterfaceMethodsTableMethod['fields']) {
  const args = Object.create(null);

  // reset bit index
  parser.bitIndex = 0;

  for (const [i, { name, domain }] of fields.entries()) {
    args[name] = FIELD_TYPE_SELECTOR[domain](parser, fields[i + 1]);
  }

  return args;
}

function parseMethodFrame(parser: Parser) {
  const classId = parseInt2(parser);
  const methodId = parseInt2(parser);

  if (methodTable[classId] === undefined || methodTable[classId][methodId] === undefined) {
    return new Error(`bad classId, methodId pair: ${classId}, ${methodId}`);
  }

  const method = methodTable[classId][methodId];
  const args = parseFields(parser, method.fields);
  return { type: FrameType.METHOD, method, args };
}

function parseHeaderFrame(parser: Parser) {
  const classIndex = parseInt2(parser);
  const weight = parseInt2(parser);
  const size = parseInt8(parser);
  const classInfo = classes[classIndex];
  const propertyFlags = parseInt2(parser);
  const fields = [];
  for (const [i, field] of classInfo.fields.entries()) {
    if ((i + 1) % 15 === 0) {
      parseInt2(parser);
    }

    if (propertyFlags & (1 << (15 - (i % 15)))) {
      fields.push(field);
    }
  }

  const properties = parseFields(parser, fields);
  return { type: FrameType.HEADER, classInfo, weight, properties, size };
}

function parseBodyFrame(parser: Parser, frameSize: number) {
  const data = (parser.buffer as Buffer).slice(parser.offset, frameSize);
  parser.offset += frameSize;
  return { type: FrameType.BODY, data };
}

function parseHeartbeatFrame() {
  return { type: FrameType.HEARTBEAT };
}

/**
 * Called the appropriate parser for the specified type.
 *
 * 1: FrameType.METHOD
 * 2: FrameType.HEADER
 * 3: FrameType.BODY
 * 8: FrameType.HEARTBEAT
 *
 */
function parseType(parser: Parser, type: number, frameSize: number) {
  switch (type) {
    case 1:
      return parseMethodFrame(parser);
    case 2:
      return parseHeaderFrame(parser);
    case 3:
      return parseBodyFrame(parser, frameSize);
    case 8:
      return parseHeartbeatFrame();
    default:
      return new Error(kUnknownFrameType);
  }
}

export class Parser {
  public offset: number = 0;
  public buffer: Buffer | null = null;
  public bitIndex: number = 0;
  private handleResponse: InterfaceConfiguration['handleResponse'];

  constructor(options: InterfaceConfiguration) {
    if (!options) {
      throw new TypeError('Options are mandatory.');
    }

    if (typeof options.handleResponse !== 'function') {
      throw new TypeError('options.handleResponse must be defined');
    }

    this.handleResponse = options.handleResponse;
    this.execute = this.execute.bind(this);
  }

  /**
   * Make sure it is possible to reset data we are getting
   */
  public reset() {
    this.offset = 0;
    this.bitIndex = 0;
    this.buffer = null;
  }

  /**
   * Parse the redis buffer
   *
   * Data flows in the following fashion:
   *  |-------------------------------|-----------|
   *  | frameType [1 byte]            |           |
   *  | frameChannel [2 bytes]        |   Header  |
   *  | frameSize [4 bytes]           |           |
   *  |-------------------------------|-----------|
   *  | Frame - <frameSize> bytes     |   Frame   |
   *  |-------------------------------|-----------|
   *  | FrameEnd - 1 byte [206]       |    End    |
   *  --------------------------------------------|
   */
  public execute(buffer: Buffer) {
    if (this.buffer === null) {
      this.buffer = buffer;
      this.offset = 0;
    } else {
      // if we already have some sort of buffer -> create a new buffer
      // with unused data from old one & new data
      const oldLength = this.buffer.length;
      const remainingLength = oldLength - this.offset;
      const newBuffer = Buffer.allocUnsafe(remainingLength + buffer.length);
      this.buffer.copy(newBuffer, 0, this.offset, oldLength);
      buffer.copy(newBuffer, remainingLength, 0, buffer.length);
      this.buffer = newBuffer;
      this.offset = 0;
    }

    // ensure that we have more than 7 bytes -
    // so that there is a chance we can parse a complete header + frame
    if (this.offset + HEADER_SIZE < this.buffer.length) {
      return;
    }

    while (this.offset < this.buffer.length) {
      const offset = this.offset;

      // Header
      const frameType = parseInt1(this);
      const frameChannel = parseInt2(this);
      const frameSize = parseInt4(this);

      // verify that we had collected enough data to parse the whole frame
      // we need to have FRAME_SIZE (dynamic) + FRAME_END (1 byte)
      // that is why its >= and not just >
      if (this.offset + frameSize >= this.buffer.length) {
        this.offset = offset;
        return;
      }

      // Frame
      const response = parseType(this, frameType, frameSize);

      // NOTE: probably not a good idea to crash the process, rather do an error emit
      // Verify that we've correctly parsed everything
      assert.equal(this.buffer[this.offset++], INDICATOR_FRAME_END, kMissingFrame);

      // pass the response on to the client library
      this.handleResponse(frameChannel, response);
    }

    // once we've parsed the buffer completely -> remove ref to it
    this.buffer = null;
  }
}

export default Parser;
