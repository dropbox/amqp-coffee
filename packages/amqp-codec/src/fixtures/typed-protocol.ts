export const enum FieldTypes {
    octet = "octet",
    table = "table",
    longstr = "longstr",
    shortstr = "shortstr",
    short = "short",
    long = "long",
    bit = "bit",
    timestamp = "timestamp",
    longlong = "longlong"
}
export const enum FieldNames {
    versionMajor = "versionMajor",
    versionMinor = "versionMinor",
    serverProperties = "serverProperties",
    mechanisms = "mechanisms",
    locales = "locales",
    clientProperties = "clientProperties",
    mechanism = "mechanism",
    response = "response",
    locale = "locale",
    challenge = "challenge",
    channelMax = "channelMax",
    frameMax = "frameMax",
    heartbeat = "heartbeat",
    virtualHost = "virtualHost",
    reserved1 = "reserved1",
    reserved2 = "reserved2",
    replyCode = "replyCode",
    replyText = "replyText",
    classId = "classId",
    methodId = "methodId",
    reason = "reason",
    active = "active",
    exchange = "exchange",
    type = "type",
    passive = "passive",
    durable = "durable",
    autoDelete = "autoDelete",
    internal = "internal",
    noWait = "noWait",
    arguments = "arguments",
    ifUnused = "ifUnused",
    destination = "destination",
    source = "source",
    routingKey = "routingKey",
    queue = "queue",
    exclusive = "exclusive",
    messageCount = "messageCount",
    consumerCount = "consumerCount",
    ifEmpty = "ifEmpty",
    contentType = "contentType",
    contentEncoding = "contentEncoding",
    headers = "headers",
    deliveryMode = "deliveryMode",
    priority = "priority",
    correlationId = "correlationId",
    replyTo = "replyTo",
    expiration = "expiration",
    messageId = "messageId",
    timestamp = "timestamp",
    userId = "userId",
    appId = "appId",
    reserved = "reserved",
    prefetchSize = "prefetchSize",
    prefetchCount = "prefetchCount",
    global = "global",
    consumerTag = "consumerTag",
    noLocal = "noLocal",
    noAck = "noAck",
    mandatory = "mandatory",
    immediate = "immediate",
    deliveryTag = "deliveryTag",
    redelivered = "redelivered",
    multiple = "multiple",
    requeue = "requeue"
}
export const enum MethodNames {
    connectionStart = "connectionStart",
    connectionStartOk = "connectionStartOk",
    connectionSecure = "connectionSecure",
    connectionSecureOk = "connectionSecureOk",
    connectionTune = "connectionTune",
    connectionTuneOk = "connectionTuneOk",
    connectionOpen = "connectionOpen",
    connectionOpenOk = "connectionOpenOk",
    connectionClose = "connectionClose",
    connectionCloseOk = "connectionCloseOk",
    connectionBlocked = "connectionBlocked",
    connectionUnblocked = "connectionUnblocked",
    channelOpen = "channelOpen",
    channelOpenOk = "channelOpenOk",
    channelFlow = "channelFlow",
    channelFlowOk = "channelFlowOk",
    channelClose = "channelClose",
    channelCloseOk = "channelCloseOk",
    exchangeDeclare = "exchangeDeclare",
    exchangeDeclareOk = "exchangeDeclareOk",
    exchangeDelete = "exchangeDelete",
    exchangeDeleteOk = "exchangeDeleteOk",
    exchangeBind = "exchangeBind",
    exchangeBindOk = "exchangeBindOk",
    exchangeUnbind = "exchangeUnbind",
    exchangeUnbindOk = "exchangeUnbindOk",
    queueDeclare = "queueDeclare",
    queueDeclareOk = "queueDeclareOk",
    queueBind = "queueBind",
    queueBindOk = "queueBindOk",
    queueUnbind = "queueUnbind",
    queueUnbindOk = "queueUnbindOk",
    queuePurge = "queuePurge",
    queuePurgeOk = "queuePurgeOk",
    queueDelete = "queueDelete",
    queueDeleteOk = "queueDeleteOk",
    basicQos = "basicQos",
    basicQosOk = "basicQosOk",
    basicConsume = "basicConsume",
    basicConsumeOk = "basicConsumeOk",
    basicCancel = "basicCancel",
    basicCancelOk = "basicCancelOk",
    basicPublish = "basicPublish",
    basicReturn = "basicReturn",
    basicDeliver = "basicDeliver",
    basicGet = "basicGet",
    basicGetOk = "basicGetOk",
    basicGetEmpty = "basicGetEmpty",
    basicAck = "basicAck",
    basicReject = "basicReject",
    basicRecoverAsync = "basicRecoverAsync",
    basicRecover = "basicRecover",
    basicRecoverOk = "basicRecoverOk",
    basicNack = "basicNack",
    txSelect = "txSelect",
    txSelectOk = "txSelectOk",
    txCommit = "txCommit",
    txCommitOk = "txCommitOk",
    txRollback = "txRollback",
    txRollbackOk = "txRollbackOk",
    confirmSelect = "confirmSelect",
    confirmSelectOk = "confirmSelectOk"
}
export const enum ClassNames {
    connection = "connection",
    channel = "channel",
    exchange = "exchange",
    queue = "queue",
    basic = "basic",
    tx = "tx",
    confirm = "confirm"
}
export const enum ClassIds {
    connection = 10,
    channel = 20,
    exchange = 40,
    queue = 50,
    basic = 60,
    tx = 90,
    confirm = 85
}
export type ClassMethodIds = "10_10" | "10_11" | "10_20" | "10_21" | "10_30" | "10_31" | "10_40" | "10_41" | "10_50" | "10_51" | "10_60" | "10_61" | "20_10" | "20_11" | "20_20" | "20_21" | "20_40" | "20_41" | "40_10" | "40_11" | "40_20" | "40_21" | "40_30" | "40_31" | "40_40" | "40_51" | "50_10" | "50_11" | "50_20" | "50_21" | "50_50" | "50_51" | "50_30" | "50_31" | "50_40" | "50_41" | "60_10" | "60_11" | "60_20" | "60_21" | "60_30" | "60_31" | "60_40" | "60_50" | "60_60" | "60_70" | "60_71" | "60_72" | "60_80" | "60_90" | "60_100" | "60_110" | "60_111" | "60_120" | "90_10" | "90_11" | "90_20" | "90_21" | "90_30" | "90_31" | "85_10" | "85_11";
export type Field = {
    name: FieldNames;
    domain: FieldTypes;
};
export type MethodArgTypes = {
    [MethodNames.connectionStart]: {
        [FieldNames.versionMajor]: number;
        [FieldNames.versionMinor]: number;
        [FieldNames.serverProperties]: Record<string, any>;
        [FieldNames.mechanisms]: string;
        [FieldNames.locales]: string;
    };
    [MethodNames.connectionStartOk]: {
        [FieldNames.clientProperties]: Record<string, any>;
        [FieldNames.mechanism]: string;
        [FieldNames.response]: string;
        [FieldNames.locale]: string;
    };
    [MethodNames.connectionSecure]: {
        [FieldNames.challenge]: string;
    };
    [MethodNames.connectionSecureOk]: {
        [FieldNames.response]: string;
    };
    [MethodNames.connectionTune]: {
        [FieldNames.channelMax]: number;
        [FieldNames.frameMax]: number;
        [FieldNames.heartbeat]: number;
    };
    [MethodNames.connectionTuneOk]: {
        [FieldNames.channelMax]: number;
        [FieldNames.frameMax]: number;
        [FieldNames.heartbeat]: number;
    };
    [MethodNames.connectionOpen]: {
        [FieldNames.virtualHost]: string;
        [FieldNames.reserved1]: string;
        [FieldNames.reserved2]: boolean;
    };
    [MethodNames.connectionOpenOk]: {
        [FieldNames.reserved1]: string;
    };
    [MethodNames.connectionClose]: {
        [FieldNames.replyCode]: number;
        [FieldNames.replyText]: string;
        [FieldNames.classId]: number;
        [FieldNames.methodId]: number;
    };
    [MethodNames.connectionCloseOk]: never;
    [MethodNames.connectionBlocked]: {
        [FieldNames.reason]: string;
    };
    [MethodNames.connectionUnblocked]: never;
    [MethodNames.channelOpen]: {
        [FieldNames.reserved1]: string;
    };
    [MethodNames.channelOpenOk]: {
        [FieldNames.reserved1]: string;
    };
    [MethodNames.channelFlow]: {
        [FieldNames.active]: boolean;
    };
    [MethodNames.channelFlowOk]: {
        [FieldNames.active]: boolean;
    };
    [MethodNames.channelClose]: {
        [FieldNames.replyCode]: number;
        [FieldNames.replyText]: string;
        [FieldNames.classId]: number;
        [FieldNames.methodId]: number;
    };
    [MethodNames.channelCloseOk]: never;
    [MethodNames.exchangeDeclare]: {
        [FieldNames.reserved1]: number;
        [FieldNames.exchange]: string;
        [FieldNames.type]: string;
        [FieldNames.passive]: boolean;
        [FieldNames.durable]: boolean;
        [FieldNames.autoDelete]: boolean;
        [FieldNames.internal]: boolean;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.exchangeDeclareOk]: never;
    [MethodNames.exchangeDelete]: {
        [FieldNames.reserved1]: number;
        [FieldNames.exchange]: string;
        [FieldNames.ifUnused]: boolean;
        [FieldNames.noWait]: boolean;
    };
    [MethodNames.exchangeDeleteOk]: never;
    [MethodNames.exchangeBind]: {
        [FieldNames.reserved1]: number;
        [FieldNames.destination]: string;
        [FieldNames.source]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.exchangeBindOk]: never;
    [MethodNames.exchangeUnbind]: {
        [FieldNames.reserved1]: number;
        [FieldNames.destination]: string;
        [FieldNames.source]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.exchangeUnbindOk]: never;
    [MethodNames.queueDeclare]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.passive]: boolean;
        [FieldNames.durable]: boolean;
        [FieldNames.exclusive]: boolean;
        [FieldNames.autoDelete]: boolean;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.queueDeclareOk]: {
        [FieldNames.queue]: string;
        [FieldNames.messageCount]: number;
        [FieldNames.consumerCount]: number;
    };
    [MethodNames.queueBind]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.queueBindOk]: never;
    [MethodNames.queueUnbind]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.queueUnbindOk]: never;
    [MethodNames.queuePurge]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.noWait]: boolean;
    };
    [MethodNames.queuePurgeOk]: {
        [FieldNames.messageCount]: number;
    };
    [MethodNames.queueDelete]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.ifUnused]: boolean;
        [FieldNames.ifEmpty]: boolean;
        [FieldNames.noWait]: boolean;
    };
    [MethodNames.queueDeleteOk]: {
        [FieldNames.messageCount]: number;
    };
    [MethodNames.basicQos]: {
        [FieldNames.prefetchSize]: number;
        [FieldNames.prefetchCount]: number;
        [FieldNames.global]: boolean;
    };
    [MethodNames.basicQosOk]: never;
    [MethodNames.basicConsume]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.consumerTag]: string;
        [FieldNames.noLocal]: boolean;
        [FieldNames.noAck]: boolean;
        [FieldNames.exclusive]: boolean;
        [FieldNames.noWait]: boolean;
        [FieldNames.arguments]: Record<string, any>;
    };
    [MethodNames.basicConsumeOk]: {
        [FieldNames.consumerTag]: string;
    };
    [MethodNames.basicCancel]: {
        [FieldNames.consumerTag]: string;
        [FieldNames.noWait]: boolean;
    };
    [MethodNames.basicCancelOk]: {
        [FieldNames.consumerTag]: string;
    };
    [MethodNames.basicPublish]: {
        [FieldNames.reserved1]: number;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.mandatory]: boolean;
        [FieldNames.immediate]: boolean;
    };
    [MethodNames.basicReturn]: {
        [FieldNames.replyCode]: number;
        [FieldNames.replyText]: string;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
    };
    [MethodNames.basicDeliver]: {
        [FieldNames.consumerTag]: string;
        [FieldNames.deliveryTag]: number;
        [FieldNames.redelivered]: boolean;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
    };
    [MethodNames.basicGet]: {
        [FieldNames.reserved1]: number;
        [FieldNames.queue]: string;
        [FieldNames.noAck]: boolean;
    };
    [MethodNames.basicGetOk]: {
        [FieldNames.deliveryTag]: number;
        [FieldNames.redelivered]: boolean;
        [FieldNames.exchange]: string;
        [FieldNames.routingKey]: string;
        [FieldNames.messageCount]: number;
    };
    [MethodNames.basicGetEmpty]: {
        [FieldNames.reserved1]: string;
    };
    [MethodNames.basicAck]: {
        [FieldNames.deliveryTag]: number;
        [FieldNames.multiple]: boolean;
    };
    [MethodNames.basicReject]: {
        [FieldNames.deliveryTag]: number;
        [FieldNames.requeue]: boolean;
    };
    [MethodNames.basicRecoverAsync]: {
        [FieldNames.requeue]: boolean;
    };
    [MethodNames.basicRecover]: {
        [FieldNames.requeue]: boolean;
    };
    [MethodNames.basicRecoverOk]: never;
    [MethodNames.basicNack]: {
        [FieldNames.deliveryTag]: number;
        [FieldNames.multiple]: boolean;
        [FieldNames.requeue]: boolean;
    };
    [MethodNames.txSelect]: never;
    [MethodNames.txSelectOk]: never;
    [MethodNames.txCommit]: never;
    [MethodNames.txCommitOk]: never;
    [MethodNames.txRollback]: never;
    [MethodNames.txRollbackOk]: never;
    [MethodNames.confirmSelect]: {
        [FieldNames.noWait]: boolean;
    };
    [MethodNames.confirmSelectOk]: never;
};
export type connectionStart = {
    name: MethodNames.connectionStart;
    classIndex: ClassIds.connection;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.versionMajor;
            domain: FieldTypes.octet;
        },
        {
            name: FieldNames.versionMinor;
            domain: FieldTypes.octet;
        },
        {
            name: FieldNames.serverProperties;
            domain: FieldTypes.table;
        },
        {
            name: FieldNames.mechanisms;
            domain: FieldTypes.longstr;
        },
        {
            name: FieldNames.locales;
            domain: FieldTypes.longstr;
        }
    ];
};
export type connectionStartOk = {
    name: MethodNames.connectionStartOk;
    classIndex: ClassIds.connection;
    methodIndex: 11;
    fields: [
        {
            name: FieldNames.clientProperties;
            domain: FieldTypes.table;
        },
        {
            name: FieldNames.mechanism;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.response;
            domain: FieldTypes.longstr;
        },
        {
            name: FieldNames.locale;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type connectionSecure = {
    name: MethodNames.connectionSecure;
    classIndex: ClassIds.connection;
    methodIndex: 20;
    fields: [
        {
            name: FieldNames.challenge;
            domain: FieldTypes.longstr;
        }
    ];
};
export type connectionSecureOk = {
    name: MethodNames.connectionSecureOk;
    classIndex: ClassIds.connection;
    methodIndex: 21;
    fields: [
        {
            name: FieldNames.response;
            domain: FieldTypes.longstr;
        }
    ];
};
export type connectionTune = {
    name: MethodNames.connectionTune;
    classIndex: ClassIds.connection;
    methodIndex: 30;
    fields: [
        {
            name: FieldNames.channelMax;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.frameMax;
            domain: FieldTypes.long;
        },
        {
            name: FieldNames.heartbeat;
            domain: FieldTypes.short;
        }
    ];
};
export type connectionTuneOk = {
    name: MethodNames.connectionTuneOk;
    classIndex: ClassIds.connection;
    methodIndex: 31;
    fields: [
        {
            name: FieldNames.channelMax;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.frameMax;
            domain: FieldTypes.long;
        },
        {
            name: FieldNames.heartbeat;
            domain: FieldTypes.short;
        }
    ];
};
export type connectionOpen = {
    name: MethodNames.connectionOpen;
    classIndex: ClassIds.connection;
    methodIndex: 40;
    fields: [
        {
            name: FieldNames.virtualHost;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.reserved2;
            domain: FieldTypes.bit;
        }
    ];
};
export type connectionOpenOk = {
    name: MethodNames.connectionOpenOk;
    classIndex: ClassIds.connection;
    methodIndex: 41;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type connectionClose = {
    name: MethodNames.connectionClose;
    classIndex: ClassIds.connection;
    methodIndex: 50;
    fields: [
        {
            name: FieldNames.replyCode;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.replyText;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.classId;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.methodId;
            domain: FieldTypes.short;
        }
    ];
};
export type connectionCloseOk = {
    name: MethodNames.connectionCloseOk;
    classIndex: ClassIds.connection;
    methodIndex: 51;
    fields: [
    ];
};
export type connectionBlocked = {
    name: MethodNames.connectionBlocked;
    classIndex: ClassIds.connection;
    methodIndex: 60;
    fields: [
        {
            name: FieldNames.reason;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type connectionUnblocked = {
    name: MethodNames.connectionUnblocked;
    classIndex: ClassIds.connection;
    methodIndex: 61;
    fields: [
    ];
};
export type channelOpen = {
    name: MethodNames.channelOpen;
    classIndex: ClassIds.channel;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type channelOpenOk = {
    name: MethodNames.channelOpenOk;
    classIndex: ClassIds.channel;
    methodIndex: 11;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.longstr;
        }
    ];
};
export type channelFlow = {
    name: MethodNames.channelFlow;
    classIndex: ClassIds.channel;
    methodIndex: 20;
    fields: [
        {
            name: FieldNames.active;
            domain: FieldTypes.bit;
        }
    ];
};
export type channelFlowOk = {
    name: MethodNames.channelFlowOk;
    classIndex: ClassIds.channel;
    methodIndex: 21;
    fields: [
        {
            name: FieldNames.active;
            domain: FieldTypes.bit;
        }
    ];
};
export type channelClose = {
    name: MethodNames.channelClose;
    classIndex: ClassIds.channel;
    methodIndex: 40;
    fields: [
        {
            name: FieldNames.replyCode;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.replyText;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.classId;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.methodId;
            domain: FieldTypes.short;
        }
    ];
};
export type channelCloseOk = {
    name: MethodNames.channelCloseOk;
    classIndex: ClassIds.channel;
    methodIndex: 41;
    fields: [
    ];
};
export type exchangeDeclare = {
    name: MethodNames.exchangeDeclare;
    classIndex: ClassIds.exchange;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.type;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.passive;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.durable;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.autoDelete;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.internal;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type exchangeDeclareOk = {
    name: MethodNames.exchangeDeclareOk;
    classIndex: ClassIds.exchange;
    methodIndex: 11;
    fields: [
    ];
};
export type exchangeDelete = {
    name: MethodNames.exchangeDelete;
    classIndex: ClassIds.exchange;
    methodIndex: 20;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.ifUnused;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        }
    ];
};
export type exchangeDeleteOk = {
    name: MethodNames.exchangeDeleteOk;
    classIndex: ClassIds.exchange;
    methodIndex: 21;
    fields: [
    ];
};
export type exchangeBind = {
    name: MethodNames.exchangeBind;
    classIndex: ClassIds.exchange;
    methodIndex: 30;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.destination;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.source;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type exchangeBindOk = {
    name: MethodNames.exchangeBindOk;
    classIndex: ClassIds.exchange;
    methodIndex: 31;
    fields: [
    ];
};
export type exchangeUnbind = {
    name: MethodNames.exchangeUnbind;
    classIndex: ClassIds.exchange;
    methodIndex: 40;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.destination;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.source;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type exchangeUnbindOk = {
    name: MethodNames.exchangeUnbindOk;
    classIndex: ClassIds.exchange;
    methodIndex: 51;
    fields: [
    ];
};
export type queueDeclare = {
    name: MethodNames.queueDeclare;
    classIndex: ClassIds.queue;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.passive;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.durable;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.exclusive;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.autoDelete;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type queueDeclareOk = {
    name: MethodNames.queueDeclareOk;
    classIndex: ClassIds.queue;
    methodIndex: 11;
    fields: [
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.messageCount;
            domain: FieldTypes.long;
        },
        {
            name: FieldNames.consumerCount;
            domain: FieldTypes.long;
        }
    ];
};
export type queueBind = {
    name: MethodNames.queueBind;
    classIndex: ClassIds.queue;
    methodIndex: 20;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type queueBindOk = {
    name: MethodNames.queueBindOk;
    classIndex: ClassIds.queue;
    methodIndex: 21;
    fields: [
    ];
};
export type queueUnbind = {
    name: MethodNames.queueUnbind;
    classIndex: ClassIds.queue;
    methodIndex: 50;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type queueUnbindOk = {
    name: MethodNames.queueUnbindOk;
    classIndex: ClassIds.queue;
    methodIndex: 51;
    fields: [
    ];
};
export type queuePurge = {
    name: MethodNames.queuePurge;
    classIndex: ClassIds.queue;
    methodIndex: 30;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        }
    ];
};
export type queuePurgeOk = {
    name: MethodNames.queuePurgeOk;
    classIndex: ClassIds.queue;
    methodIndex: 31;
    fields: [
        {
            name: FieldNames.messageCount;
            domain: FieldTypes.long;
        }
    ];
};
export type queueDelete = {
    name: MethodNames.queueDelete;
    classIndex: ClassIds.queue;
    methodIndex: 40;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.ifUnused;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.ifEmpty;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        }
    ];
};
export type queueDeleteOk = {
    name: MethodNames.queueDeleteOk;
    classIndex: ClassIds.queue;
    methodIndex: 41;
    fields: [
        {
            name: FieldNames.messageCount;
            domain: FieldTypes.long;
        }
    ];
};
export type basicQos = {
    name: MethodNames.basicQos;
    classIndex: ClassIds.basic;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.prefetchSize;
            domain: FieldTypes.long;
        },
        {
            name: FieldNames.prefetchCount;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.global;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicQosOk = {
    name: MethodNames.basicQosOk;
    classIndex: ClassIds.basic;
    methodIndex: 11;
    fields: [
    ];
};
export type basicConsume = {
    name: MethodNames.basicConsume;
    classIndex: ClassIds.basic;
    methodIndex: 20;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.consumerTag;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noLocal;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noAck;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.exclusive;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.arguments;
            domain: FieldTypes.table;
        }
    ];
};
export type basicConsumeOk = {
    name: MethodNames.basicConsumeOk;
    classIndex: ClassIds.basic;
    methodIndex: 21;
    fields: [
        {
            name: FieldNames.consumerTag;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type basicCancel = {
    name: MethodNames.basicCancel;
    classIndex: ClassIds.basic;
    methodIndex: 30;
    fields: [
        {
            name: FieldNames.consumerTag;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicCancelOk = {
    name: MethodNames.basicCancelOk;
    classIndex: ClassIds.basic;
    methodIndex: 31;
    fields: [
        {
            name: FieldNames.consumerTag;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type basicPublish = {
    name: MethodNames.basicPublish;
    classIndex: ClassIds.basic;
    methodIndex: 40;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.mandatory;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.immediate;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicReturn = {
    name: MethodNames.basicReturn;
    classIndex: ClassIds.basic;
    methodIndex: 50;
    fields: [
        {
            name: FieldNames.replyCode;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.replyText;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type basicDeliver = {
    name: MethodNames.basicDeliver;
    classIndex: ClassIds.basic;
    methodIndex: 60;
    fields: [
        {
            name: FieldNames.consumerTag;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.deliveryTag;
            domain: FieldTypes.longlong;
        },
        {
            name: FieldNames.redelivered;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type basicGet = {
    name: MethodNames.basicGet;
    classIndex: ClassIds.basic;
    methodIndex: 70;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.short;
        },
        {
            name: FieldNames.queue;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.noAck;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicGetOk = {
    name: MethodNames.basicGetOk;
    classIndex: ClassIds.basic;
    methodIndex: 71;
    fields: [
        {
            name: FieldNames.deliveryTag;
            domain: FieldTypes.longlong;
        },
        {
            name: FieldNames.redelivered;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.exchange;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.routingKey;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.messageCount;
            domain: FieldTypes.long;
        }
    ];
};
export type basicGetEmpty = {
    name: MethodNames.basicGetEmpty;
    classIndex: ClassIds.basic;
    methodIndex: 72;
    fields: [
        {
            name: FieldNames.reserved1;
            domain: FieldTypes.shortstr;
        }
    ];
};
export type basicAck = {
    name: MethodNames.basicAck;
    classIndex: ClassIds.basic;
    methodIndex: 80;
    fields: [
        {
            name: FieldNames.deliveryTag;
            domain: FieldTypes.longlong;
        },
        {
            name: FieldNames.multiple;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicReject = {
    name: MethodNames.basicReject;
    classIndex: ClassIds.basic;
    methodIndex: 90;
    fields: [
        {
            name: FieldNames.deliveryTag;
            domain: FieldTypes.longlong;
        },
        {
            name: FieldNames.requeue;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicRecoverAsync = {
    name: MethodNames.basicRecoverAsync;
    classIndex: ClassIds.basic;
    methodIndex: 100;
    fields: [
        {
            name: FieldNames.requeue;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicRecover = {
    name: MethodNames.basicRecover;
    classIndex: ClassIds.basic;
    methodIndex: 110;
    fields: [
        {
            name: FieldNames.requeue;
            domain: FieldTypes.bit;
        }
    ];
};
export type basicRecoverOk = {
    name: MethodNames.basicRecoverOk;
    classIndex: ClassIds.basic;
    methodIndex: 111;
    fields: [
    ];
};
export type basicNack = {
    name: MethodNames.basicNack;
    classIndex: ClassIds.basic;
    methodIndex: 120;
    fields: [
        {
            name: FieldNames.deliveryTag;
            domain: FieldTypes.longlong;
        },
        {
            name: FieldNames.multiple;
            domain: FieldTypes.bit;
        },
        {
            name: FieldNames.requeue;
            domain: FieldTypes.bit;
        }
    ];
};
export type txSelect = {
    name: MethodNames.txSelect;
    classIndex: ClassIds.tx;
    methodIndex: 10;
    fields: [
    ];
};
export type txSelectOk = {
    name: MethodNames.txSelectOk;
    classIndex: ClassIds.tx;
    methodIndex: 11;
    fields: [
    ];
};
export type txCommit = {
    name: MethodNames.txCommit;
    classIndex: ClassIds.tx;
    methodIndex: 20;
    fields: [
    ];
};
export type txCommitOk = {
    name: MethodNames.txCommitOk;
    classIndex: ClassIds.tx;
    methodIndex: 21;
    fields: [
    ];
};
export type txRollback = {
    name: MethodNames.txRollback;
    classIndex: ClassIds.tx;
    methodIndex: 30;
    fields: [
    ];
};
export type txRollbackOk = {
    name: MethodNames.txRollbackOk;
    classIndex: ClassIds.tx;
    methodIndex: 31;
    fields: [
    ];
};
export type confirmSelect = {
    name: MethodNames.confirmSelect;
    classIndex: ClassIds.confirm;
    methodIndex: 10;
    fields: [
        {
            name: FieldNames.noWait;
            domain: FieldTypes.bit;
        }
    ];
};
export type confirmSelectOk = {
    name: MethodNames.confirmSelectOk;
    classIndex: ClassIds.confirm;
    methodIndex: 11;
    fields: [
    ];
};
export type connection = {
    name: ClassNames.connection;
    index: ClassIds.connection;
    fields: [
    ];
    methods: [
        connectionStart,
        connectionStartOk,
        connectionSecure,
        connectionSecureOk,
        connectionTune,
        connectionTuneOk,
        connectionOpen,
        connectionOpenOk,
        connectionClose,
        connectionCloseOk,
        connectionBlocked,
        connectionUnblocked
    ];
};
export type channel = {
    name: ClassNames.channel;
    index: ClassIds.channel;
    fields: [
    ];
    methods: [
        channelOpen,
        channelOpenOk,
        channelFlow,
        channelFlowOk,
        channelClose,
        channelCloseOk
    ];
};
export type exchange = {
    name: ClassNames.exchange;
    index: ClassIds.exchange;
    fields: [
    ];
    methods: [
        exchangeDeclare,
        exchangeDeclareOk,
        exchangeDelete,
        exchangeDeleteOk,
        exchangeBind,
        exchangeBindOk,
        exchangeUnbind,
        exchangeUnbindOk
    ];
};
export type queue = {
    name: ClassNames.queue;
    index: ClassIds.queue;
    fields: [
    ];
    methods: [
        queueDeclare,
        queueDeclareOk,
        queueBind,
        queueBindOk,
        queueUnbind,
        queueUnbindOk,
        queuePurge,
        queuePurgeOk,
        queueDelete,
        queueDeleteOk
    ];
};
export type basic = {
    name: ClassNames.basic;
    index: ClassIds.basic;
    fields: [
        {
            name: FieldNames.contentType;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.contentEncoding;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.headers;
            domain: FieldTypes.table;
        },
        {
            name: FieldNames.deliveryMode;
            domain: FieldTypes.octet;
        },
        {
            name: FieldNames.priority;
            domain: FieldTypes.octet;
        },
        {
            name: FieldNames.correlationId;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.replyTo;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.expiration;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.messageId;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.timestamp;
            domain: FieldTypes.timestamp;
        },
        {
            name: FieldNames.type;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.userId;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.appId;
            domain: FieldTypes.shortstr;
        },
        {
            name: FieldNames.reserved;
            domain: FieldTypes.shortstr;
        }
    ];
    methods: [
        basicQos,
        basicQosOk,
        basicConsume,
        basicConsumeOk,
        basicCancel,
        basicCancelOk,
        basicPublish,
        basicReturn,
        basicDeliver,
        basicGet,
        basicGetOk,
        basicGetEmpty,
        basicAck,
        basicReject,
        basicRecoverAsync,
        basicRecover,
        basicRecoverOk,
        basicNack
    ];
};
export type confirm = {
    name: ClassNames.confirm;
    index: ClassIds.confirm;
    fields: [
    ];
    methods: [
        confirmSelect,
        confirmSelectOk
    ];
};
export type tx = {
    name: ClassNames.tx;
    index: ClassIds.tx;
    fields: [
    ];
    methods: [
        txSelect,
        txSelectOk,
        txCommit,
        txCommitOk,
        txRollback,
        txRollbackOk
    ];
};
export type MethodsTable = {
    [MethodNames.connectionStart]: connectionStart;
    [MethodNames.connectionStartOk]: connectionStartOk;
    [MethodNames.connectionSecure]: connectionSecure;
    [MethodNames.connectionSecureOk]: connectionSecureOk;
    [MethodNames.connectionTune]: connectionTune;
    [MethodNames.connectionTuneOk]: connectionTuneOk;
    [MethodNames.connectionOpen]: connectionOpen;
    [MethodNames.connectionOpenOk]: connectionOpenOk;
    [MethodNames.connectionClose]: connectionClose;
    [MethodNames.connectionCloseOk]: connectionCloseOk;
    [MethodNames.connectionBlocked]: connectionBlocked;
    [MethodNames.connectionUnblocked]: connectionUnblocked;
    [MethodNames.channelOpen]: channelOpen;
    [MethodNames.channelOpenOk]: channelOpenOk;
    [MethodNames.channelFlow]: channelFlow;
    [MethodNames.channelFlowOk]: channelFlowOk;
    [MethodNames.channelClose]: channelClose;
    [MethodNames.channelCloseOk]: channelCloseOk;
    [MethodNames.exchangeDeclare]: exchangeDeclare;
    [MethodNames.exchangeDeclareOk]: exchangeDeclareOk;
    [MethodNames.exchangeDelete]: exchangeDelete;
    [MethodNames.exchangeDeleteOk]: exchangeDeleteOk;
    [MethodNames.exchangeBind]: exchangeBind;
    [MethodNames.exchangeBindOk]: exchangeBindOk;
    [MethodNames.exchangeUnbind]: exchangeUnbind;
    [MethodNames.exchangeUnbindOk]: exchangeUnbindOk;
    [MethodNames.queueDeclare]: queueDeclare;
    [MethodNames.queueDeclareOk]: queueDeclareOk;
    [MethodNames.queueBind]: queueBind;
    [MethodNames.queueBindOk]: queueBindOk;
    [MethodNames.queueUnbind]: queueUnbind;
    [MethodNames.queueUnbindOk]: queueUnbindOk;
    [MethodNames.queuePurge]: queuePurge;
    [MethodNames.queuePurgeOk]: queuePurgeOk;
    [MethodNames.queueDelete]: queueDelete;
    [MethodNames.queueDeleteOk]: queueDeleteOk;
    [MethodNames.basicQos]: basicQos;
    [MethodNames.basicQosOk]: basicQosOk;
    [MethodNames.basicConsume]: basicConsume;
    [MethodNames.basicConsumeOk]: basicConsumeOk;
    [MethodNames.basicCancel]: basicCancel;
    [MethodNames.basicCancelOk]: basicCancelOk;
    [MethodNames.basicPublish]: basicPublish;
    [MethodNames.basicReturn]: basicReturn;
    [MethodNames.basicDeliver]: basicDeliver;
    [MethodNames.basicGet]: basicGet;
    [MethodNames.basicGetOk]: basicGetOk;
    [MethodNames.basicGetEmpty]: basicGetEmpty;
    [MethodNames.basicAck]: basicAck;
    [MethodNames.basicReject]: basicReject;
    [MethodNames.basicRecoverAsync]: basicRecoverAsync;
    [MethodNames.basicRecover]: basicRecover;
    [MethodNames.basicRecoverOk]: basicRecoverOk;
    [MethodNames.basicNack]: basicNack;
    [MethodNames.txSelect]: txSelect;
    [MethodNames.txSelectOk]: txSelectOk;
    [MethodNames.txCommit]: txCommit;
    [MethodNames.txCommitOk]: txCommitOk;
    [MethodNames.txRollback]: txRollback;
    [MethodNames.txRollbackOk]: txRollbackOk;
    [MethodNames.confirmSelect]: confirmSelect;
    [MethodNames.confirmSelectOk]: confirmSelectOk;
};
export const methods: MethodsTable = {
    connectionStart: { name: MethodNames.connectionStart, classIndex: 10, methodIndex: 10, fields: [{ domain: FieldTypes.octet, name: FieldNames.versionMajor }, { domain: FieldTypes.octet, name: FieldNames.versionMinor }, { domain: FieldTypes.table, name: FieldNames.serverProperties }, { domain: FieldTypes.longstr, name: FieldNames.mechanisms }, { domain: FieldTypes.longstr, name: FieldNames.locales }] },
    connectionStartOk: { name: MethodNames.connectionStartOk, classIndex: 10, methodIndex: 11, fields: [{ domain: FieldTypes.table, name: FieldNames.clientProperties }, { domain: FieldTypes.shortstr, name: FieldNames.mechanism }, { domain: FieldTypes.longstr, name: FieldNames.response }, { domain: FieldTypes.shortstr, name: FieldNames.locale }] },
    connectionSecure: { name: MethodNames.connectionSecure, classIndex: 10, methodIndex: 20, fields: [{ domain: FieldTypes.longstr, name: FieldNames.challenge }] },
    connectionSecureOk: { name: MethodNames.connectionSecureOk, classIndex: 10, methodIndex: 21, fields: [{ domain: FieldTypes.longstr, name: FieldNames.response }] },
    connectionTune: { name: MethodNames.connectionTune, classIndex: 10, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.channelMax }, { domain: FieldTypes.long, name: FieldNames.frameMax }, { domain: FieldTypes.short, name: FieldNames.heartbeat }] },
    connectionTuneOk: { name: MethodNames.connectionTuneOk, classIndex: 10, methodIndex: 31, fields: [{ domain: FieldTypes.short, name: FieldNames.channelMax }, { domain: FieldTypes.long, name: FieldNames.frameMax }, { domain: FieldTypes.short, name: FieldNames.heartbeat }] },
    connectionOpen: { name: MethodNames.connectionOpen, classIndex: 10, methodIndex: 40, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.virtualHost }, { domain: FieldTypes.shortstr, name: FieldNames.reserved1 }, { domain: FieldTypes.bit, name: FieldNames.reserved2 }] },
    connectionOpenOk: { name: MethodNames.connectionOpenOk, classIndex: 10, methodIndex: 41, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    connectionClose: { name: MethodNames.connectionClose, classIndex: 10, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.short, name: FieldNames.classId }, { domain: FieldTypes.short, name: FieldNames.methodId }] },
    connectionCloseOk: { name: MethodNames.connectionCloseOk, classIndex: 10, methodIndex: 51, fields: [] },
    connectionBlocked: { name: MethodNames.connectionBlocked, classIndex: 10, methodIndex: 60, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reason }] },
    connectionUnblocked: { name: MethodNames.connectionUnblocked, classIndex: 10, methodIndex: 61, fields: [] },
    channelOpen: { name: MethodNames.channelOpen, classIndex: 20, methodIndex: 10, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    channelOpenOk: { name: MethodNames.channelOpenOk, classIndex: 20, methodIndex: 11, fields: [{ domain: FieldTypes.longstr, name: FieldNames.reserved1 }] },
    channelFlow: { name: MethodNames.channelFlow, classIndex: 20, methodIndex: 20, fields: [{ domain: FieldTypes.bit, name: FieldNames.active }] },
    channelFlowOk: { name: MethodNames.channelFlowOk, classIndex: 20, methodIndex: 21, fields: [{ domain: FieldTypes.bit, name: FieldNames.active }] },
    channelClose: { name: MethodNames.channelClose, classIndex: 20, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.short, name: FieldNames.classId }, { domain: FieldTypes.short, name: FieldNames.methodId }] },
    channelCloseOk: { name: MethodNames.channelCloseOk, classIndex: 20, methodIndex: 41, fields: [] },
    exchangeDeclare: { name: MethodNames.exchangeDeclare, classIndex: 40, methodIndex: 10, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.type }, { domain: FieldTypes.bit, name: FieldNames.passive }, { domain: FieldTypes.bit, name: FieldNames.durable }, { domain: FieldTypes.bit, name: FieldNames.autoDelete }, { domain: FieldTypes.bit, name: FieldNames.internal }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    exchangeDeclareOk: { name: MethodNames.exchangeDeclareOk, classIndex: 40, methodIndex: 11, fields: [] },
    exchangeDelete: { name: MethodNames.exchangeDelete, classIndex: 40, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.bit, name: FieldNames.ifUnused }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    exchangeDeleteOk: { name: MethodNames.exchangeDeleteOk, classIndex: 40, methodIndex: 21, fields: [] },
    exchangeBind: { name: MethodNames.exchangeBind, classIndex: 40, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.destination }, { domain: FieldTypes.shortstr, name: FieldNames.source }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    exchangeBindOk: { name: MethodNames.exchangeBindOk, classIndex: 40, methodIndex: 31, fields: [] },
    exchangeUnbind: { name: MethodNames.exchangeUnbind, classIndex: 40, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.destination }, { domain: FieldTypes.shortstr, name: FieldNames.source }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    exchangeUnbindOk: { name: MethodNames.exchangeUnbindOk, classIndex: 40, methodIndex: 51, fields: [] },
    queueDeclare: { name: MethodNames.queueDeclare, classIndex: 50, methodIndex: 10, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.passive }, { domain: FieldTypes.bit, name: FieldNames.durable }, { domain: FieldTypes.bit, name: FieldNames.exclusive }, { domain: FieldTypes.bit, name: FieldNames.autoDelete }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    queueDeclareOk: { name: MethodNames.queueDeclareOk, classIndex: 50, methodIndex: 11, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.long, name: FieldNames.messageCount }, { domain: FieldTypes.long, name: FieldNames.consumerCount }] },
    queueBind: { name: MethodNames.queueBind, classIndex: 50, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    queueBindOk: { name: MethodNames.queueBindOk, classIndex: 50, methodIndex: 21, fields: [] },
    queueUnbind: { name: MethodNames.queueUnbind, classIndex: 50, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    queueUnbindOk: { name: MethodNames.queueUnbindOk, classIndex: 50, methodIndex: 51, fields: [] },
    queuePurge: { name: MethodNames.queuePurge, classIndex: 50, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    queuePurgeOk: { name: MethodNames.queuePurgeOk, classIndex: 50, methodIndex: 31, fields: [{ domain: FieldTypes.long, name: FieldNames.messageCount }] },
    queueDelete: { name: MethodNames.queueDelete, classIndex: 50, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.ifUnused }, { domain: FieldTypes.bit, name: FieldNames.ifEmpty }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    queueDeleteOk: { name: MethodNames.queueDeleteOk, classIndex: 50, methodIndex: 41, fields: [{ domain: FieldTypes.long, name: FieldNames.messageCount }] },
    basicQos: { name: MethodNames.basicQos, classIndex: 60, methodIndex: 10, fields: [{ domain: FieldTypes.long, name: FieldNames.prefetchSize }, { domain: FieldTypes.short, name: FieldNames.prefetchCount }, { domain: FieldTypes.bit, name: FieldNames.global }] },
    basicQosOk: { name: MethodNames.basicQosOk, classIndex: 60, methodIndex: 11, fields: [] },
    basicConsume: { name: MethodNames.basicConsume, classIndex: 60, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.bit, name: FieldNames.noLocal }, { domain: FieldTypes.bit, name: FieldNames.noAck }, { domain: FieldTypes.bit, name: FieldNames.exclusive }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    basicConsumeOk: { name: MethodNames.basicConsumeOk, classIndex: 60, methodIndex: 21, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }] },
    basicCancel: { name: MethodNames.basicCancel, classIndex: 60, methodIndex: 30, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    basicCancelOk: { name: MethodNames.basicCancelOk, classIndex: 60, methodIndex: 31, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }] },
    basicPublish: { name: MethodNames.basicPublish, classIndex: 60, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.mandatory }, { domain: FieldTypes.bit, name: FieldNames.immediate }] },
    basicReturn: { name: MethodNames.basicReturn, classIndex: 60, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }] },
    basicDeliver: { name: MethodNames.basicDeliver, classIndex: 60, methodIndex: 60, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.redelivered }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }] },
    basicGet: { name: MethodNames.basicGet, classIndex: 60, methodIndex: 70, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.noAck }] },
    basicGetOk: { name: MethodNames.basicGetOk, classIndex: 60, methodIndex: 71, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.redelivered }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.long, name: FieldNames.messageCount }] },
    basicGetEmpty: { name: MethodNames.basicGetEmpty, classIndex: 60, methodIndex: 72, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    basicAck: { name: MethodNames.basicAck, classIndex: 60, methodIndex: 80, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.multiple }] },
    basicReject: { name: MethodNames.basicReject, classIndex: 60, methodIndex: 90, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.requeue }] },
    basicRecoverAsync: { name: MethodNames.basicRecoverAsync, classIndex: 60, methodIndex: 100, fields: [{ domain: FieldTypes.bit, name: FieldNames.requeue }] },
    basicRecover: { name: MethodNames.basicRecover, classIndex: 60, methodIndex: 110, fields: [{ domain: FieldTypes.bit, name: FieldNames.requeue }] },
    basicRecoverOk: { name: MethodNames.basicRecoverOk, classIndex: 60, methodIndex: 111, fields: [] },
    basicNack: { name: MethodNames.basicNack, classIndex: 60, methodIndex: 120, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.multiple }, { domain: FieldTypes.bit, name: FieldNames.requeue }] },
    txSelect: { name: MethodNames.txSelect, classIndex: 90, methodIndex: 10, fields: [] },
    txSelectOk: { name: MethodNames.txSelectOk, classIndex: 90, methodIndex: 11, fields: [] },
    txCommit: { name: MethodNames.txCommit, classIndex: 90, methodIndex: 20, fields: [] },
    txCommitOk: { name: MethodNames.txCommitOk, classIndex: 90, methodIndex: 21, fields: [] },
    txRollback: { name: MethodNames.txRollback, classIndex: 90, methodIndex: 30, fields: [] },
    txRollbackOk: { name: MethodNames.txRollbackOk, classIndex: 90, methodIndex: 31, fields: [] },
    confirmSelect: { name: MethodNames.confirmSelect, classIndex: 85, methodIndex: 10, fields: [{ domain: FieldTypes.bit, name: FieldNames.noWait }] },
    confirmSelectOk: { name: MethodNames.confirmSelectOk, classIndex: 85, methodIndex: 11, fields: [] }
};
export type ClassMethodsTable = {
    "10_10": connectionStart;
    "10_11": connectionStartOk;
    "10_20": connectionSecure;
    "10_21": connectionSecureOk;
    "10_30": connectionTune;
    "10_31": connectionTuneOk;
    "10_40": connectionOpen;
    "10_41": connectionOpenOk;
    "10_50": connectionClose;
    "10_51": connectionCloseOk;
    "10_60": connectionBlocked;
    "10_61": connectionUnblocked;
    "20_10": channelOpen;
    "20_11": channelOpenOk;
    "20_20": channelFlow;
    "20_21": channelFlowOk;
    "20_40": channelClose;
    "20_41": channelCloseOk;
    "40_10": exchangeDeclare;
    "40_11": exchangeDeclareOk;
    "40_20": exchangeDelete;
    "40_21": exchangeDeleteOk;
    "40_30": exchangeBind;
    "40_31": exchangeBindOk;
    "40_40": exchangeUnbind;
    "40_51": exchangeUnbindOk;
    "50_10": queueDeclare;
    "50_11": queueDeclareOk;
    "50_20": queueBind;
    "50_21": queueBindOk;
    "50_50": queueUnbind;
    "50_51": queueUnbindOk;
    "50_30": queuePurge;
    "50_31": queuePurgeOk;
    "50_40": queueDelete;
    "50_41": queueDeleteOk;
    "60_10": basicQos;
    "60_11": basicQosOk;
    "60_20": basicConsume;
    "60_21": basicConsumeOk;
    "60_30": basicCancel;
    "60_31": basicCancelOk;
    "60_40": basicPublish;
    "60_50": basicReturn;
    "60_60": basicDeliver;
    "60_70": basicGet;
    "60_71": basicGetOk;
    "60_72": basicGetEmpty;
    "60_80": basicAck;
    "60_90": basicReject;
    "60_100": basicRecoverAsync;
    "60_110": basicRecover;
    "60_111": basicRecoverOk;
    "60_120": basicNack;
    "90_10": txSelect;
    "90_11": txSelectOk;
    "90_20": txCommit;
    "90_21": txCommitOk;
    "90_30": txRollback;
    "90_31": txRollbackOk;
    "85_10": confirmSelect;
    "85_11": confirmSelectOk;
};
export const classMethodsTable: ClassMethodsTable = {
    "10_10": { name: MethodNames.connectionStart, classIndex: 10, methodIndex: 10, fields: [{ domain: FieldTypes.octet, name: FieldNames.versionMajor }, { domain: FieldTypes.octet, name: FieldNames.versionMinor }, { domain: FieldTypes.table, name: FieldNames.serverProperties }, { domain: FieldTypes.longstr, name: FieldNames.mechanisms }, { domain: FieldTypes.longstr, name: FieldNames.locales }] },
    "10_11": { name: MethodNames.connectionStartOk, classIndex: 10, methodIndex: 11, fields: [{ domain: FieldTypes.table, name: FieldNames.clientProperties }, { domain: FieldTypes.shortstr, name: FieldNames.mechanism }, { domain: FieldTypes.longstr, name: FieldNames.response }, { domain: FieldTypes.shortstr, name: FieldNames.locale }] },
    "10_20": { name: MethodNames.connectionSecure, classIndex: 10, methodIndex: 20, fields: [{ domain: FieldTypes.longstr, name: FieldNames.challenge }] },
    "10_21": { name: MethodNames.connectionSecureOk, classIndex: 10, methodIndex: 21, fields: [{ domain: FieldTypes.longstr, name: FieldNames.response }] },
    "10_30": { name: MethodNames.connectionTune, classIndex: 10, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.channelMax }, { domain: FieldTypes.long, name: FieldNames.frameMax }, { domain: FieldTypes.short, name: FieldNames.heartbeat }] },
    "10_31": { name: MethodNames.connectionTuneOk, classIndex: 10, methodIndex: 31, fields: [{ domain: FieldTypes.short, name: FieldNames.channelMax }, { domain: FieldTypes.long, name: FieldNames.frameMax }, { domain: FieldTypes.short, name: FieldNames.heartbeat }] },
    "10_40": { name: MethodNames.connectionOpen, classIndex: 10, methodIndex: 40, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.virtualHost }, { domain: FieldTypes.shortstr, name: FieldNames.reserved1 }, { domain: FieldTypes.bit, name: FieldNames.reserved2 }] },
    "10_41": { name: MethodNames.connectionOpenOk, classIndex: 10, methodIndex: 41, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    "10_50": { name: MethodNames.connectionClose, classIndex: 10, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.short, name: FieldNames.classId }, { domain: FieldTypes.short, name: FieldNames.methodId }] },
    "10_51": { name: MethodNames.connectionCloseOk, classIndex: 10, methodIndex: 51, fields: [] },
    "10_60": { name: MethodNames.connectionBlocked, classIndex: 10, methodIndex: 60, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reason }] },
    "10_61": { name: MethodNames.connectionUnblocked, classIndex: 10, methodIndex: 61, fields: [] },
    "20_10": { name: MethodNames.channelOpen, classIndex: 20, methodIndex: 10, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    "20_11": { name: MethodNames.channelOpenOk, classIndex: 20, methodIndex: 11, fields: [{ domain: FieldTypes.longstr, name: FieldNames.reserved1 }] },
    "20_20": { name: MethodNames.channelFlow, classIndex: 20, methodIndex: 20, fields: [{ domain: FieldTypes.bit, name: FieldNames.active }] },
    "20_21": { name: MethodNames.channelFlowOk, classIndex: 20, methodIndex: 21, fields: [{ domain: FieldTypes.bit, name: FieldNames.active }] },
    "20_40": { name: MethodNames.channelClose, classIndex: 20, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.short, name: FieldNames.classId }, { domain: FieldTypes.short, name: FieldNames.methodId }] },
    "20_41": { name: MethodNames.channelCloseOk, classIndex: 20, methodIndex: 41, fields: [] },
    "40_10": { name: MethodNames.exchangeDeclare, classIndex: 40, methodIndex: 10, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.type }, { domain: FieldTypes.bit, name: FieldNames.passive }, { domain: FieldTypes.bit, name: FieldNames.durable }, { domain: FieldTypes.bit, name: FieldNames.autoDelete }, { domain: FieldTypes.bit, name: FieldNames.internal }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "40_11": { name: MethodNames.exchangeDeclareOk, classIndex: 40, methodIndex: 11, fields: [] },
    "40_20": { name: MethodNames.exchangeDelete, classIndex: 40, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.bit, name: FieldNames.ifUnused }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    "40_21": { name: MethodNames.exchangeDeleteOk, classIndex: 40, methodIndex: 21, fields: [] },
    "40_30": { name: MethodNames.exchangeBind, classIndex: 40, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.destination }, { domain: FieldTypes.shortstr, name: FieldNames.source }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "40_31": { name: MethodNames.exchangeBindOk, classIndex: 40, methodIndex: 31, fields: [] },
    "40_40": { name: MethodNames.exchangeUnbind, classIndex: 40, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.destination }, { domain: FieldTypes.shortstr, name: FieldNames.source }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "40_51": { name: MethodNames.exchangeUnbindOk, classIndex: 40, methodIndex: 51, fields: [] },
    "50_10": { name: MethodNames.queueDeclare, classIndex: 50, methodIndex: 10, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.passive }, { domain: FieldTypes.bit, name: FieldNames.durable }, { domain: FieldTypes.bit, name: FieldNames.exclusive }, { domain: FieldTypes.bit, name: FieldNames.autoDelete }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "50_11": { name: MethodNames.queueDeclareOk, classIndex: 50, methodIndex: 11, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.long, name: FieldNames.messageCount }, { domain: FieldTypes.long, name: FieldNames.consumerCount }] },
    "50_20": { name: MethodNames.queueBind, classIndex: 50, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "50_21": { name: MethodNames.queueBindOk, classIndex: 50, methodIndex: 21, fields: [] },
    "50_50": { name: MethodNames.queueUnbind, classIndex: 50, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "50_51": { name: MethodNames.queueUnbindOk, classIndex: 50, methodIndex: 51, fields: [] },
    "50_30": { name: MethodNames.queuePurge, classIndex: 50, methodIndex: 30, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    "50_31": { name: MethodNames.queuePurgeOk, classIndex: 50, methodIndex: 31, fields: [{ domain: FieldTypes.long, name: FieldNames.messageCount }] },
    "50_40": { name: MethodNames.queueDelete, classIndex: 50, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.ifUnused }, { domain: FieldTypes.bit, name: FieldNames.ifEmpty }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    "50_41": { name: MethodNames.queueDeleteOk, classIndex: 50, methodIndex: 41, fields: [{ domain: FieldTypes.long, name: FieldNames.messageCount }] },
    "60_10": { name: MethodNames.basicQos, classIndex: 60, methodIndex: 10, fields: [{ domain: FieldTypes.long, name: FieldNames.prefetchSize }, { domain: FieldTypes.short, name: FieldNames.prefetchCount }, { domain: FieldTypes.bit, name: FieldNames.global }] },
    "60_11": { name: MethodNames.basicQosOk, classIndex: 60, methodIndex: 11, fields: [] },
    "60_20": { name: MethodNames.basicConsume, classIndex: 60, methodIndex: 20, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.bit, name: FieldNames.noLocal }, { domain: FieldTypes.bit, name: FieldNames.noAck }, { domain: FieldTypes.bit, name: FieldNames.exclusive }, { domain: FieldTypes.bit, name: FieldNames.noWait }, { domain: FieldTypes.table, name: FieldNames.arguments }] },
    "60_21": { name: MethodNames.basicConsumeOk, classIndex: 60, methodIndex: 21, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }] },
    "60_30": { name: MethodNames.basicCancel, classIndex: 60, methodIndex: 30, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.bit, name: FieldNames.noWait }] },
    "60_31": { name: MethodNames.basicCancelOk, classIndex: 60, methodIndex: 31, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }] },
    "60_40": { name: MethodNames.basicPublish, classIndex: 60, methodIndex: 40, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.bit, name: FieldNames.mandatory }, { domain: FieldTypes.bit, name: FieldNames.immediate }] },
    "60_50": { name: MethodNames.basicReturn, classIndex: 60, methodIndex: 50, fields: [{ domain: FieldTypes.short, name: FieldNames.replyCode }, { domain: FieldTypes.shortstr, name: FieldNames.replyText }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }] },
    "60_60": { name: MethodNames.basicDeliver, classIndex: 60, methodIndex: 60, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.consumerTag }, { domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.redelivered }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }] },
    "60_70": { name: MethodNames.basicGet, classIndex: 60, methodIndex: 70, fields: [{ domain: FieldTypes.short, name: FieldNames.reserved1 }, { domain: FieldTypes.shortstr, name: FieldNames.queue }, { domain: FieldTypes.bit, name: FieldNames.noAck }] },
    "60_71": { name: MethodNames.basicGetOk, classIndex: 60, methodIndex: 71, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.redelivered }, { domain: FieldTypes.shortstr, name: FieldNames.exchange }, { domain: FieldTypes.shortstr, name: FieldNames.routingKey }, { domain: FieldTypes.long, name: FieldNames.messageCount }] },
    "60_72": { name: MethodNames.basicGetEmpty, classIndex: 60, methodIndex: 72, fields: [{ domain: FieldTypes.shortstr, name: FieldNames.reserved1 }] },
    "60_80": { name: MethodNames.basicAck, classIndex: 60, methodIndex: 80, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.multiple }] },
    "60_90": { name: MethodNames.basicReject, classIndex: 60, methodIndex: 90, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.requeue }] },
    "60_100": { name: MethodNames.basicRecoverAsync, classIndex: 60, methodIndex: 100, fields: [{ domain: FieldTypes.bit, name: FieldNames.requeue }] },
    "60_110": { name: MethodNames.basicRecover, classIndex: 60, methodIndex: 110, fields: [{ domain: FieldTypes.bit, name: FieldNames.requeue }] },
    "60_111": { name: MethodNames.basicRecoverOk, classIndex: 60, methodIndex: 111, fields: [] },
    "60_120": { name: MethodNames.basicNack, classIndex: 60, methodIndex: 120, fields: [{ domain: FieldTypes.longlong, name: FieldNames.deliveryTag }, { domain: FieldTypes.bit, name: FieldNames.multiple }, { domain: FieldTypes.bit, name: FieldNames.requeue }] },
    "90_10": { name: MethodNames.txSelect, classIndex: 90, methodIndex: 10, fields: [] },
    "90_11": { name: MethodNames.txSelectOk, classIndex: 90, methodIndex: 11, fields: [] },
    "90_20": { name: MethodNames.txCommit, classIndex: 90, methodIndex: 20, fields: [] },
    "90_21": { name: MethodNames.txCommitOk, classIndex: 90, methodIndex: 21, fields: [] },
    "90_30": { name: MethodNames.txRollback, classIndex: 90, methodIndex: 30, fields: [] },
    "90_31": { name: MethodNames.txRollbackOk, classIndex: 90, methodIndex: 31, fields: [] },
    "85_10": { name: MethodNames.confirmSelect, classIndex: 85, methodIndex: 10, fields: [{ domain: FieldTypes.bit, name: FieldNames.noWait }] },
    "85_11": { name: MethodNames.confirmSelectOk, classIndex: 85, methodIndex: 11, fields: [] }
};
export type Classes = {
    [ClassIds.connection]: connection;
    [ClassIds.channel]: channel;
    [ClassIds.exchange]: exchange;
    [ClassIds.queue]: queue;
    [ClassIds.basic]: basic;
    [ClassIds.confirm]: confirm;
    [ClassIds.tx]: tx;
};
export const classes: Classes = {
    [ClassIds.connection]: {
        name: ClassNames.connection,
        index: ClassIds.connection,
        fields: [],
        methods: [
            methods.connectionStart,
            methods.connectionStartOk,
            methods.connectionSecure,
            methods.connectionSecureOk,
            methods.connectionTune,
            methods.connectionTuneOk,
            methods.connectionOpen,
            methods.connectionOpenOk,
            methods.connectionClose,
            methods.connectionCloseOk,
            methods.connectionBlocked,
            methods.connectionUnblocked
        ]
    },
    [ClassIds.channel]: {
        name: ClassNames.channel,
        index: ClassIds.channel,
        fields: [],
        methods: [
            methods.channelOpen,
            methods.channelOpenOk,
            methods.channelFlow,
            methods.channelFlowOk,
            methods.channelClose,
            methods.channelCloseOk
        ]
    },
    [ClassIds.exchange]: {
        name: ClassNames.exchange,
        index: ClassIds.exchange,
        fields: [],
        methods: [
            methods.exchangeDeclare,
            methods.exchangeDeclareOk,
            methods.exchangeDelete,
            methods.exchangeDeleteOk,
            methods.exchangeBind,
            methods.exchangeBindOk,
            methods.exchangeUnbind,
            methods.exchangeUnbindOk
        ]
    },
    [ClassIds.queue]: {
        name: ClassNames.queue,
        index: ClassIds.queue,
        fields: [],
        methods: [
            methods.queueDeclare,
            methods.queueDeclareOk,
            methods.queueBind,
            methods.queueBindOk,
            methods.queueUnbind,
            methods.queueUnbindOk,
            methods.queuePurge,
            methods.queuePurgeOk,
            methods.queueDelete,
            methods.queueDeleteOk
        ]
    },
    [ClassIds.basic]: {
        name: ClassNames.basic,
        index: ClassIds.basic,
        fields: [
            { name: FieldNames.contentType, domain: FieldTypes.shortstr },
            { name: FieldNames.contentEncoding, domain: FieldTypes.shortstr },
            { name: FieldNames.headers, domain: FieldTypes.table },
            { name: FieldNames.deliveryMode, domain: FieldTypes.octet },
            { name: FieldNames.priority, domain: FieldTypes.octet },
            { name: FieldNames.correlationId, domain: FieldTypes.shortstr },
            { name: FieldNames.replyTo, domain: FieldTypes.shortstr },
            { name: FieldNames.expiration, domain: FieldTypes.shortstr },
            { name: FieldNames.messageId, domain: FieldTypes.shortstr },
            { name: FieldNames.timestamp, domain: FieldTypes.timestamp },
            { name: FieldNames.type, domain: FieldTypes.shortstr },
            { name: FieldNames.userId, domain: FieldTypes.shortstr },
            { name: FieldNames.appId, domain: FieldTypes.shortstr },
            { name: FieldNames.reserved, domain: FieldTypes.shortstr }
        ],
        methods: [
            methods.basicQos,
            methods.basicQosOk,
            methods.basicConsume,
            methods.basicConsumeOk,
            methods.basicCancel,
            methods.basicCancelOk,
            methods.basicPublish,
            methods.basicReturn,
            methods.basicDeliver,
            methods.basicGet,
            methods.basicGetOk,
            methods.basicGetEmpty,
            methods.basicAck,
            methods.basicReject,
            methods.basicRecoverAsync,
            methods.basicRecover,
            methods.basicRecoverOk,
            methods.basicNack
        ]
    },
    [ClassIds.confirm]: {
        name: ClassNames.confirm,
        index: ClassIds.confirm,
        fields: [],
        methods: [
            methods.confirmSelect,
            methods.confirmSelectOk
        ]
    },
    [ClassIds.tx]: {
        name: ClassNames.tx,
        index: ClassIds.tx,
        fields: [],
        methods: [
            methods.txSelect,
            methods.txSelectOk,
            methods.txCommit,
            methods.txCommitOk,
            methods.txRollback,
            methods.txRollbackOk
        ]
    }
};
