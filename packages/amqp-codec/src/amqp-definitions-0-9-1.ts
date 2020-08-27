export type Constant = [number, string];

export const enum FieldTypes {
  bit = 'bit',
  long = 'long',
  longlong = 'longlong',
  longstr = 'longstr',
  octet = 'octet',
  short = 'short',
  shortstr = 'shortstr',
  table = 'table',
  timestamp = 'timestamp',
}
  
export interface Field {
  name: string;
  domain: FieldTypes;
}

export interface Method {
  name: string;
  index: number;
  fields: Field[];
}

export interface Class {
  name: string;
  index: number;
  fields: Field[];
  methods: Method[];
}

export const constants: Constant[] = [
  [1, 'frameMethod'],
  [2, 'frameHeader'],
  [3, 'frameBody'],
  [8, 'frameHeartbeat'],
  [4096, 'frameMinSize'],
  [206, 'frameEnd'],
  [200, 'replySuccess'],
  [311, 'contentTooLarge'],
  [313, 'noConsumers'],
  [320, 'connectionForced'],
  [402, 'invalidPath'],
  [403, 'accessRefused'],
  [404, 'notFound'],
  [405, 'resourceLocked'],
  [406, 'preconditionFailed'],
  [501, 'frameError'],
  [502, 'syntaxError'],
  [503, 'commandInvalid'],
  [504, 'channelError'],
  [505, 'unexpectedFrame'],
  [506, 'resourceError'],
  [530, 'notAllowed'],
  [540, 'notImplemented'],
  [541, 'internalError'],
]

export const classes: Class[] = [
  {
    name: 'connection',
    index: 10,
    fields: [],
    methods: [
      {
        name: 'start',
        index: 10,
        fields: [
          { name: 'versionMajor', domain: FieldTypes.octet },
          { name: 'versionMinor', domain: FieldTypes.octet },
          { name: 'serverProperties', domain: FieldTypes.table },
          { name: 'mechanisms', domain: FieldTypes.longstr },
          { name: 'locales', domain: FieldTypes.longstr },
        ],
      },
      {
        name: 'startOk',
        index: 11,
        fields: [
          { name: 'clientProperties', domain: FieldTypes.table },
          { name: 'mechanism', domain: FieldTypes.shortstr },
          { name: 'response', domain: FieldTypes.longstr },
          { name: 'locale', domain: FieldTypes.shortstr },
        ],
      },
      {
        name: 'secure',
        index: 20,
        fields: [{ name: 'challenge', domain: FieldTypes.longstr }],
      },
      {
        name: 'secureOk',
        index: 21,
        fields: [{ name: 'response', domain: FieldTypes.longstr }],
      },
      {
        name: 'tune',
        index: 30,
        fields: [
          { name: 'channelMax', domain: FieldTypes.short },
          { name: 'frameMax', domain: FieldTypes.long },
          { name: 'heartbeat', domain: FieldTypes.short },
        ],
      },
      {
        name: 'tuneOk',
        index: 31,
        fields: [
          { name: 'channelMax', domain: FieldTypes.short },
          { name: 'frameMax', domain: FieldTypes.long },
          { name: 'heartbeat', domain: FieldTypes.short },
        ],
      },
      {
        name: 'open',
        index: 40,
        fields: [
          { name: 'virtualHost', domain: FieldTypes.shortstr },
          { name: 'reserved1', domain: FieldTypes.shortstr },
          { name: 'reserved2', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'openOk',
        index: 41,
        fields: [{ name: 'reserved1', domain: FieldTypes.shortstr }],
      },
      {
        name: 'close',
        index: 50,
        fields: [
          { name: 'replyCode', domain: FieldTypes.short },
          { name: 'replyText', domain: FieldTypes.shortstr },
          { name: 'classId', domain: FieldTypes.short },
          { name: 'methodId', domain: FieldTypes.short },
        ],
      },
      { name: 'closeOk', index: 51, fields: [] },
      {
        name: 'blocked',
        index: 60,
        fields: [{ name: 'reason', domain: FieldTypes.shortstr }],
      },
      { name: 'unblocked', index: 61, fields: [] },
    ],
  },
  {
    name: 'channel',
    index: 20,
    fields: [],
    methods: [
      {
        name: 'open',
        index: 10,
        fields: [{ name: 'reserved1', domain: FieldTypes.shortstr }],
      },
      {
        name: 'openOk',
        index: 11,
        fields: [{ name: 'reserved1', domain: FieldTypes.longstr }],
      },
      { name: 'flow', index: 20, fields: [{ name: 'active', domain: FieldTypes.bit }] },
      {
        name: 'flowOk',
        index: 21,
        fields: [{ name: 'active', domain: FieldTypes.bit }],
      },
      {
        name: 'close',
        index: 40,
        fields: [
          { name: 'replyCode', domain: FieldTypes.short },
          { name: 'replyText', domain: FieldTypes.shortstr },
          { name: 'classId', domain: FieldTypes.short },
          { name: 'methodId', domain: FieldTypes.short },
        ],
      },
      { name: 'closeOk', index: 41, fields: [] },
    ],
  },
  {
    name: 'exchange',
    index: 40,
    fields: [],
    methods: [
      {
        name: 'declare',
        index: 10,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'type', domain: FieldTypes.shortstr },
          { name: 'passive', domain: FieldTypes.bit },
          { name: 'durable', domain: FieldTypes.bit },
          { name: 'autoDelete', domain: FieldTypes.bit },
          { name: 'internal', domain: FieldTypes.bit },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      { name: 'declareOk', index: 11, fields: [] },
      {
        name: 'delete',
        index: 20,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'ifUnused', domain: FieldTypes.bit },
          { name: 'noWait', domain: FieldTypes.bit },
        ],
      },
      { name: 'deleteOk', index: 21, fields: [] },
      {
        name: 'bind',
        index: 30,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'destination', domain: FieldTypes.shortstr },
          { name: 'source', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      { name: 'bindOk', index: 31, fields: [] },
      {
        name: 'unbind',
        index: 40,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'destination', domain: FieldTypes.shortstr },
          { name: 'source', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      { name: 'unbindOk', index: 51, fields: [] },
    ],
  },
  {
    name: 'queue',
    index: 50,
    fields: [],
    methods: [
      {
        name: 'declare',
        index: 10,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'passive', domain: FieldTypes.bit },
          { name: 'durable', domain: FieldTypes.bit },
          { name: 'exclusive', domain: FieldTypes.bit },
          { name: 'autoDelete', domain: FieldTypes.bit },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      {
        name: 'declareOk',
        index: 11,
        fields: [
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'messageCount', domain: FieldTypes.long },
          { name: 'consumerCount', domain: FieldTypes.long },
        ],
      },
      {
        name: 'bind',
        index: 20,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      { name: 'bindOk', index: 21, fields: [] },
      {
        name: 'unbind',
        index: 50,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      { name: 'unbindOk', index: 51, fields: [] },
      {
        name: 'purge',
        index: 30,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'noWait', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'purgeOk',
        index: 31,
        fields: [{ name: 'messageCount', domain: FieldTypes.long }],
      },
      {
        name: 'delete',
        index: 40,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'ifUnused', domain: FieldTypes.bit },
          { name: 'ifEmpty', domain: FieldTypes.bit },
          { name: 'noWait', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'deleteOk',
        index: 41,
        fields: [{ name: 'messageCount', domain: FieldTypes.long }],
      },
    ],
  },
  {
    name: 'basic',
    index: 60,
    fields: [
      { name: 'contentType', domain: FieldTypes.shortstr },
      { name: 'contentEncoding', domain: FieldTypes.shortstr },
      { name: 'headers', domain: FieldTypes.table },
      { name: 'deliveryMode', domain: FieldTypes.octet },
      { name: 'priority', domain: FieldTypes.octet },
      { name: 'correlationId', domain: FieldTypes.shortstr },
      { name: 'replyTo', domain: FieldTypes.shortstr },
      { name: 'expiration', domain: FieldTypes.shortstr },
      { name: 'messageId', domain: FieldTypes.shortstr },
      { name: 'timestamp', domain: FieldTypes.timestamp },
      { name: 'type', domain: FieldTypes.shortstr },
      { name: 'userId', domain: FieldTypes.shortstr },
      { name: 'appId', domain: FieldTypes.shortstr },
      { name: 'reserved', domain: FieldTypes.shortstr },
    ],
    methods: [
      {
        name: 'qos',
        index: 10,
        fields: [
          { name: 'prefetchSize', domain: FieldTypes.long },
          { name: 'prefetchCount', domain: FieldTypes.short },
          { name: 'global', domain: FieldTypes.bit },
        ],
      },
      { name: 'qosOk', index: 11, fields: [] },
      {
        name: 'consume',
        index: 20,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'consumerTag', domain: FieldTypes.shortstr },
          { name: 'noLocal', domain: FieldTypes.bit },
          { name: 'noAck', domain: FieldTypes.bit },
          { name: 'exclusive', domain: FieldTypes.bit },
          { name: 'noWait', domain: FieldTypes.bit },
          { name: 'arguments', domain: FieldTypes.table },
        ],
      },
      {
        name: 'consumeOk',
        index: 21,
        fields: [{ name: 'consumerTag', domain: FieldTypes.shortstr }],
      },
      {
        name: 'cancel',
        index: 30,
        fields: [
          { name: 'consumerTag', domain: FieldTypes.shortstr },
          { name: 'noWait', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'cancelOk',
        index: 31,
        fields: [{ name: 'consumerTag', domain: FieldTypes.shortstr }],
      },
      {
        name: 'publish',
        index: 40,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'mandatory', domain: FieldTypes.bit },
          { name: 'immediate', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'return',
        index: 50,
        fields: [
          { name: 'replyCode', domain: FieldTypes.short },
          { name: 'replyText', domain: FieldTypes.shortstr },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
        ],
      },
      {
        name: 'deliver',
        index: 60,
        fields: [
          { name: 'consumerTag', domain: FieldTypes.shortstr },
          { name: 'deliveryTag', domain: FieldTypes.longlong },
          { name: 'redelivered', domain: FieldTypes.bit },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
        ],
      },
      {
        name: 'get',
        index: 70,
        fields: [
          { name: 'reserved1', domain: FieldTypes.short },
          { name: 'queue', domain: FieldTypes.shortstr },
          { name: 'noAck', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'getOk',
        index: 71,
        fields: [
          { name: 'deliveryTag', domain: FieldTypes.longlong },
          { name: 'redelivered', domain: FieldTypes.bit },
          { name: 'exchange', domain: FieldTypes.shortstr },
          { name: 'routingKey', domain: FieldTypes.shortstr },
          { name: 'messageCount', domain: FieldTypes.long },
        ],
      },
      {
        name: 'getEmpty',
        index: 72,
        fields: [{ name: 'reserved1', domain: FieldTypes.shortstr }],
      },
      {
        name: 'ack',
        index: 80,
        fields: [
          { name: 'deliveryTag', domain: FieldTypes.longlong },
          { name: 'multiple', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'reject',
        index: 90,
        fields: [
          { name: 'deliveryTag', domain: FieldTypes.longlong },
          { name: 'requeue', domain: FieldTypes.bit },
        ],
      },
      {
        name: 'recoverAsync',
        index: 100,
        fields: [{ name: 'requeue', domain: FieldTypes.bit }],
      },
      {
        name: 'recover',
        index: 110,
        fields: [{ name: 'requeue', domain: FieldTypes.bit }],
      },
      { name: 'recoverOk', index: 111, fields: [] },
      {
        name: 'nack',
        index: 120,
        fields: [
          { name: 'deliveryTag', domain: FieldTypes.longlong },
          { name: 'multiple', domain: FieldTypes.bit },
          { name: 'requeue', domain: FieldTypes.bit },
        ],
      },
    ],
  },
  {
    name: 'tx',
    index: 90,
    fields: [],
    methods: [
      { name: 'select', index: 10, fields: [] },
      { name: 'selectOk', index: 11, fields: [] },
      { name: 'commit', index: 20, fields: [] },
      { name: 'commitOk', index: 21, fields: [] },
      { name: 'rollback', index: 30, fields: [] },
      { name: 'rollbackOk', index: 31, fields: [] },
    ],
  },
  {
    name: 'confirm',
    index: 85,
    fields: [],
    methods: [
      {
        name: 'select',
        index: 10,
        fields: [{ name: 'noWait', domain: FieldTypes.bit }],
      },
      { name: 'selectOk', index: 11, fields: [] },
    ],
  },
]
