import assert = require('assert');
import {
  AMQPTypes,
  EndFrame,
  FrameType,
  HeartbeatFrame,
  INDICATOR_FRAME_END,
  InterfaceContent,
  InterfaceContentHeader,
  InterfaceMethodFrame,
  InterfaceProtocol,
  MaxFrameSize,
} from './constants';
import { classes, InterfaceField, InterfaceMethodsTableMethod } from './protocol';

function isFloat(value: number) {
  return value === +value && value !== (value | 0);
}

function isBigInt(value: number) {
  return value > 0xffffffff;
}

function serializeInt1(serializer: Serializer, int: number) {
  const { buffer } = serializer;
  assert(serializer.offset + 1 <= serializer.buffer.length, 'write out of bounds');

  buffer[serializer.offset++] = int;
}

function serializeInt2(serializer: Serializer, int: number) {
  const { buffer } = serializer;
  assert(serializer.offset + 2 <= serializer.buffer.length, 'write out of bounds');

  buffer[serializer.offset++] = (int & 0xFF00) >> 8;
  buffer[serializer.offset++] = (int & 0x00FF) >> 0;
}

function serializeInt4(serializer: Serializer, int: number) {
  const { buffer } = serializer;
  assert(serializer.offset + 4 <= serializer.buffer.length, 'write out of bounds');

  buffer[serializer.offset++] = (int & 0xFF000000) >> 24;
  buffer[serializer.offset++] = (int & 0x00FF0000) >> 16;
  buffer[serializer.offset++] = (int & 0x0000FF00) >> 8;
  buffer[serializer.offset++] = (int & 0x000000FF) >> 0;
}

function serializeInt8(serializer: Serializer, int: number) {
  const { buffer } = serializer;
  assert(serializer.offset + 8 <= serializer.buffer.length, 'write out of bounds');

  buffer[serializer.offset++] = (int & 0xFF00000000000000) >> 56;
  buffer[serializer.offset++] = (int & 0x00FF000000000000) >> 48;
  buffer[serializer.offset++] = (int & 0x0000FF0000000000) >> 40;
  buffer[serializer.offset++] = (int & 0x000000FF00000000) >> 32;
  buffer[serializer.offset++] = (int & 0x00000000FF000000) >> 24;
  buffer[serializer.offset++] = (int & 0x0000000000FF0000) >> 16;
  buffer[serializer.offset++] = (int & 0x000000000000FF00) >> 8;
  buffer[serializer.offset++] = (int & 0x00000000000000FF) >> 0;
}

function serializeBit(serializer: Serializer, param: boolean, field: InterfaceField, nextField?: InterfaceField) {
  if (typeof param !== 'boolean') {
    throw new TypeError(`Unmatched field: ${JSON.stringify(field)}`);
  }

  if (param === true) {
    serializer.bitField |= (1 << serializer.bitIndex);
  }

  serializer.bitIndex += 1;

  if (nextField == null || nextField.domain !== 'bit') {
    serializer.buffer[serializer.offset++] = serializer.bitField;
    serializer.bitField = 0;
    serializer.bitIndex = 0;
  }
}

function serializeOctet(serializer: Serializer, param: number, field: InterfaceField) {
  if (typeof param !== 'number' || param > 0xFF) {
    throw new TypeError(`Unmatched field: ${JSON.stringify(field)}`);
  }

  serializeInt1(serializer, param);
}

function serializeShort(serializer: Serializer, param: number, field: InterfaceField) {
  if (typeof param !== 'number' || param > 0xFFFF) {
    throw new TypeError(`Unmatched field: ${JSON.stringify(field)}`);
  }

  serializeInt2(serializer, param);
}

function serializeLong(serializer: Serializer, param: number, field: InterfaceField) {
  if (typeof param !== 'number' || param > 0xFFFFFFFF) {
    throw new TypeError(`Unmatched field: ${JSON.stringify(field)}`);
  }

  serializeInt4(serializer, param);
}

function serializeShortString(serializer: Serializer, input: string, field: InterfaceField) {
  if (typeof input !== 'string') {
    throw new TypeError('param must be a string');
  }

  if (input.length > 0xFF) {
    throw new TypeError(`Unmatched field: ${JSON.stringify(field)}`);
  }

  const byteLength = Buffer.byteLength(input, 'utf8');
  if (byteLength > 0xFF) {
    throw new TypeError('String too long for "shortstr" parameter');
  }

  const { buffer } = serializer;
  if (1 + byteLength + serializer.offset >= buffer.length) {
    throw new TypeError('Not enough space in buffer for "shortstr"');
  }

  buffer[serializer.offset++] = byteLength;
  buffer.write(input, serializer.offset, byteLength, 'utf8');
  serializer.offset += byteLength;
}

function serializeBuffer(serializer: Serializer, param: Buffer) {
  const byteLength = param.length;
  serializeInt4(serializer, byteLength);
  param.copy(serializer.buffer, serializer.offset, 0, byteLength);
  serializer.offset += byteLength;
}

function serializeDouble(serializer: Serializer, param: number) {
  serializer.buffer.writeDoubleBE(param, serializer.offset);
  serializer.offset += 8;
}

function serializeDate(serializer: Serializer, param: Date) {
  serializeInt8(serializer, param.valueOf() / 1e3);
}

function serializeArray(serializer: Serializer, param: any[], field: InterfaceField) {
  // Save our position so that we can go back and write the byte length of this array
  // at the beginning of the packet (once we have serialized all elements).
  const lengthIndex = serializer.offset;
  serializer.offset += 4; // sizeof long
  const startIndex = serializer.offset;

  for (const value of param) {
    serializeValue(serializer, value, field);
  }

  const endIndex = serializer.offset;
  serializer.offset = lengthIndex;
  serializeInt4(serializer, endIndex - startIndex);
  serializer.offset = endIndex;
}

function serializeValue(serializer: Serializer, param: any, field: InterfaceField) {
  switch (typeof param) {
    case 'string':
      serializer.buffer[serializer.offset++] = AMQPTypes.STRING;
      serializeLongString(serializer, param, field);
      break;

    case 'number':
      if (isFloat(param) === false) {
        if (isBigInt(param) === true) {
          // 64-bit uint
          serializer.buffer[serializer.offset++] = AMQPTypes.SIGNED_64BIT;
          serializeInt8(serializer, param);
        } else {
          // 32-bit uint
          serializer.buffer[serializer.offset++] = AMQPTypes.INTEGER;
          serializeInt4(serializer, param);
        }
      } else {
        // 64-bit float
        serializer.buffer[serializer.offset++] = AMQPTypes._64BIT_FLOAT;
        serializeDouble(serializer, param);
      }
      break;

    case 'boolean':
      serializer.buffer[serializer.offset++] = AMQPTypes.BOOLEAN;
      serializer.buffer[serializer.offset++] = param;
      break;

    default:
      if (param instanceof Date) {
        serializer.buffer[serializer.offset++] = AMQPTypes.TIME;
        serializeDate(serializer, param);
      } else if (Buffer.isBuffer(param) === true) {
        serializer.buffer[serializer.offset++] = AMQPTypes.BYTE_ARRAY;
        serializeBuffer(serializer, param);
      } else if (Array.isArray(param)) {
        serializer.buffer[serializer.offset++] = AMQPTypes.ARRAY;
        serializeArray(serializer, param, field);
      } else if (typeof param === 'object') {
        serializer.buffer[serializer.offset++] = AMQPTypes.HASH;
        serializeTable(serializer, param, field);
      } else {
        throw new TypeError(`unsupported type in amqp table = ${typeof param}`);
      }
  }
}

function serializeLongString(serializer: Serializer, param: any, field: InterfaceField) {
  if (typeof param === 'string') {
    const byteLength = Buffer.byteLength(param, 'utf8');
    serializeInt4(serializer, byteLength);
    serializer.buffer.write(param, serializer.offset, byteLength, 'utf8');
    serializer.offset += byteLength;
  } else if (Buffer.isBuffer(param)) {
    serializeBuffer(serializer, param);
  } else if (typeof param === 'object') {
    serializeTable(serializer, param, field);
  } else {
    throw new TypeError(`Unmatched input: ${JSON.stringify(param)}`);
  }
}

function serializeTable(serializer: Serializer, param: any, field: InterfaceField) {
  if (typeof param !== 'object') {
    throw new TypeError('param must be an object');
  }

  // Save our position so that we can go back and write the length of this table
  // at the beginning of the packet (once we know how many entries there are).
  const lengthIndex = serializer.offset;
  serializer.offset += 4; // sizeof long
  const startIndex = serializer.offset;

  for (const [key, value] of Object.entries(param)) {
    serializeShortString(serializer, key, field);
    serializeValue(serializer, value, field);
  }

  const endIndex = serializer.offset;
  serializer.offset = lengthIndex;
  serializeInt4(serializer, endIndex - startIndex);
  serializer.offset = endIndex;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
const FIELD_TYPE_SELECTOR = Object.setPrototypeOf({
  bit: serializeBit,
  long: serializeLong,
  longlong: serializeInt8,
  longstr: serializeLongString,
  octet: serializeOctet,
  short: serializeShort,
  shortstr: serializeShortString,
  table: serializeTable,
  timestamp: serializeInt8,
}, null);

const kFieldDefaults = Object.setPrototypeOf({
  bit: false,
  short: 0,
  shortstr: '',
}, null);

function serializeFieldStrict(serializer: Serializer, args: any, field: InterfaceField, nextField?: InterfaceField) {
  const { name, domain } = field;

  if (hasOwnProperty.call(args, name) === false) {
    if (name.startsWith('reserved')) {
      args[name] = kFieldDefaults[domain] || true;
    } else if (name === 'noWait') {
      args[name] = false;
    } else {
      throw new TypeError(`Missing field "${name}" of type "${domain}"`);
    }
  }

  FIELD_TYPE_SELECTOR[domain](serializer, args[name], field, nextField);
}

function serializeFieldLoose(serializer: Serializer, args: any, field: InterfaceField, nextField?: InterfaceField) {
  const { name, domain } = field;

  if (hasOwnProperty.call(args, name) === false) {
    return;
  }

  FIELD_TYPE_SELECTOR[domain](serializer, args[name], field, nextField);
}

function serializeFields(
  serializer: Serializer,
  fields: InterfaceMethodsTableMethod['fields'],
  args: object,
  strict: boolean,
) {
  serializer.bitField = 0;
  serializer.bitIndex = 0;

  const fieldSerializer = strict ? serializeFieldStrict : serializeFieldLoose;
  for (const [i, field] of fields.entries()) {
    fieldSerializer(serializer, args, field, fields[i + 1]);
  }
}

function encodeMethod(serializer: Serializer, channel: number, data: InterfaceMethodFrame): Buffer {
  serializer.offset = 1; // reset used offset
  const { buffer } = serializer;
  const { method } = data;

  // frame type
  buffer[0] = FrameType.METHOD;

  // channel number
  serializeInt2(serializer, channel);

  // length, which we don't know yet, 4 bytes
  const lengthIndex = serializer.offset;

  // skip length, prepare fields
  const startIndex = serializer.offset = lengthIndex + 4;
  serializeInt2(serializer, method.classIndex);  // short, classId
  serializeInt2(serializer, method.methodIndex); // short, methodId
  serializeFields(serializer, method.fields, data.args, true);

  // capture current offset, rewind back to lengthIndex & return back to current offset
  const endIndex = serializer.offset;
  serializer.offset = lengthIndex;
  serializeInt4(serializer, endIndex - startIndex);

  // end frame
  buffer[endIndex] = INDICATOR_FRAME_END;

  const size = endIndex + 1;
  const methodBuffer = Buffer.allocUnsafe(size);
  buffer.copy(methodBuffer, 0, 0, size);

  return methodBuffer;
}

function encodeHeader(serializer: Serializer, channel: number, args: InterfaceContentHeader): Buffer {
  const { buffer } = serializer;
  const classInfo = classes[60];

  // start preparing the frame
  buffer[0] = FrameType.HEADER;
  serializer.offset = 1; // reset used offset

  // push channel
  serializeInt2(serializer, channel);

  // we don't know the length yet, so just skip it
  const lengthStart = serializer.offset;
  // length will take 4 bytes -> don't write there yet
  const bodyStart = serializer.offset += 4;

  // prepare header
  serializeInt2(serializer, classInfo.index); // class 60 for Basic
  serializeInt2(serializer, 0); // weight, always 0 for rabbitmq
  serializeInt8(serializer, args.size); // byte size of body

  // properties - first propertyFlags
  const propertyFlags = [0];

  /**
   * The property flags are an array of bits that indicate the presence or absence of each
   * property value in sequence. The bits are ordered from most high to low - bit 15 indicates
   * the first property.
   *
   * The property flags can specify more than 16 properties. If the last bit (0) is set, this indicates that a
   * further property flags field follows. There are many property flags fields as needed.
   */
  for (const [i, field] of classInfo.fields.entries()) {
    if ((i + 1) % 16 === 0) {
      // we have more than 15 properties, set bit 0 to 1 of the previous bit set
      propertyFlags[Math.floor((i - 1) / 15)] |= 1 << 0;
      propertyFlags.push(0);
    }

    if (hasOwnProperty.call(args, field.name)) {
      propertyFlags[Math.floor(i / 15)] |= 1 << (15 - i);
    }
  }

  for (const propertyFlag of propertyFlags) {
    serializeInt2(serializer, propertyFlag);
  }

  // now the actual properties.
  serializeFields(serializer, classInfo.fields, args, false);

  const bodyEnd = serializer.offset;
  // Go back to the header and write in the length now that we know it.
  serializer.offset = lengthStart;
  serializeInt4(serializer, bodyEnd - bodyStart);
  serializer.offset = bodyEnd;

  // 1 OCTET END
  serializer.buffer[serializer.offset++] = INDICATOR_FRAME_END;

  // we create this new buffer to make sure it doesn't get overwritten in a
  // situation where we're backed up flushing to the network
  const headerBuffer = Buffer.allocUnsafe(serializer.offset);
  buffer.copy(headerBuffer, 0, 0, serializer.offset);
  return headerBuffer;
}

function encodeBody(serializer: Serializer, channel: number, args: InterfaceContent): Buffer[] {
  const body = args.data;

  if (Buffer.isBuffer(body) === false) {
    throw new Error('args.data must be a buffer');
  }

  const { buffer, maxFrameSize } = serializer;
  serializer.offset = 1;
  buffer[0] = FrameType.BODY;
  serializeInt2(serializer, channel);
  const headerLengthStart = serializer.offset;

  let offset = 0;
  const frames = [];
  while (offset < body.length) {
    const length = Math.min((body.length - offset), maxFrameSize);
    serializer.offset = headerLengthStart;
    serializeInt4(serializer, length);

    const frame = Buffer.concat([
      buffer.slice(0, 7),
      body.slice(offset, offset + length),
      EndFrame,
    ], length + 8);

    frames.push(frame);
    offset += length;
  }

  return frames;
}

function encodeHeartbeat(): Buffer {
  return HeartbeatFrame;
}

const encodeSelector = Object.setPrototypeOf({
  [FrameType.METHOD]: encodeMethod,
  [FrameType.HEADER]: encodeHeader,
  [FrameType.BODY]: encodeBody,
  [FrameType.HEARTBEAT]: encodeHeartbeat,
}, null);

export class Serializer {
  public buffer: Buffer;
  public offset: number = 0;
  public bitIndex: number = 0;
  public bitField: number = 0;
  public maxFrameSize: number;

  constructor(maxFrameSize: number = MaxFrameSize) {
    this.buffer = Buffer.allocUnsafe(MaxFrameSize);
    this.maxFrameSize = maxFrameSize;
  }

  public setMaxFrameSize(frameSize: number) {
    if (frameSize === this.maxFrameSize) {
      return;
    }

    if (frameSize < this.maxFrameSize) {
      this.buffer = this.buffer.slice(0, frameSize);
    } else {
      this.buffer = Buffer.allocUnsafe(frameSize);
    }

    this.maxFrameSize = frameSize;
  }

  public encode(channel: number, data: InterfaceProtocol): Buffer {
    return encodeSelector[data.type](this, channel, data);
  }
}

export default Serializer;
