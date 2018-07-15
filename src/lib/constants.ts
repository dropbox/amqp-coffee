export const CHANNEL_STATE = {
  open: Symbol('open'),
  closed: Symbol('closed'),
  opening: Symbol('opening'),
};

export const CONNECTION_STATE = {
  opening: Symbol('opening'),
  open: Symbol('open'),
  closed: Symbol('closed'),
  reconnecting: Symbol('reconnecting'),
  destroyed: Symbol('destroyed'),
};

export const MaxFrameSize = 131072;
export const MaxEmptyFrameSize = 8;

export const AMQPTypes = Object.freeze({
  STRING: 'S'.charCodeAt(0),
  INTEGER: 'I'.charCodeAt(0),
  HASH: 'F'.charCodeAt(0),
  TIME: 'T'.charCodeAt(0),
  DECIMAL: 'D'.charCodeAt(0),
  BOOLEAN: 't'.charCodeAt(0),
  SIGNED_8BIT: 'b'.charCodeAt(0),
  SIGNED_16BIT: 's'.charCodeAt(0),
  SIGNED_64BIT: 'l'.charCodeAt(0),
  _32BIT_FLOAT: 'f'.charCodeAt(0),
  _64BIT_FLOAT: 'd'.charCodeAt(0),
  VOID: 'v'.charCodeAt(0),
  BYTE_ARRAY: 'x'.charCodeAt(0),
  ARRAY: 'A'.charCodeAt(0),
  TEN: '10'.charCodeAt(0),
  BOOLEAN_TRUE: '\x01',
  BOOLEAN_FALSE: '\x00',
});

export const Indicators = Object.freeze({
  FRAME_END: 206,
});

export const FrameType = Object.freeze({
  METHOD: 1,
  HEADER: 2,
  BODY: 3,
  HEARTBEAT: 8,
});

export const HandshakeFrame = Buffer.from('AMQP' + String.fromCharCode(0, 0, 9, 1));
export const HeartbeatFrame = Buffer.from([8, 0, 0, 0, 0, 0, 0, 206]);
export const EndFrame = Buffer.from([206]);
