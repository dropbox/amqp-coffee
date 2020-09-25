import { FrameType } from './fixtures/typed-protocol'

export const kMissingFrame = new Error('missing end frame')
export const kUnknownFrameType = 'unknown frametype'
export const MaxFrameSize = 131072
export const MaxEmptyFrameSize = 8

export const AMQPTypes = {
  ARRAY: 'A'.charCodeAt(0),
  BOOLEAN: 't'.charCodeAt(0),
  BOOLEAN_FALSE: '\x00',
  BOOLEAN_TRUE: '\x01',
  BYTE_ARRAY: 'x'.charCodeAt(0),
  DECIMAL: 'D'.charCodeAt(0),
  HASH: 'F'.charCodeAt(0),
  INTEGER: 'I'.charCodeAt(0),
  SIGNED_16BIT: 's'.charCodeAt(0),
  SIGNED_64BIT: 'l'.charCodeAt(0),
  SIGNED_8BIT: 'b'.charCodeAt(0),
  STRING: 'S'.charCodeAt(0),
  TEN: '10'.charCodeAt(0),
  TIME: 'T'.charCodeAt(0),
  VOID: 'v'.charCodeAt(0),
  _32BIT_FLOAT: 'f'.charCodeAt(0),
  _64BIT_FLOAT: 'd'.charCodeAt(0),
}

Object.setPrototypeOf(AMQPTypes, null)

export type AMQPDataTypes = string 
  | number 
  | boolean 
  | Date 
  | Buffer
  | AMQPDataTypes[]
  | { [key: string]: AMQPDataTypes }

export const INDICATOR_FRAME_END = 206

export const HandshakeFrame = Buffer.from('AMQP' + String.fromCharCode(0, 0, 9, 1))
export const HeartbeatFrame = Buffer.from([FrameType.HEARTBEAT, 0, 0, 0, 0, 0, 0, INDICATOR_FRAME_END])
export const EndFrame = Buffer.from([INDICATOR_FRAME_END])
export const ServiceChannel = 0
export { FrameType }