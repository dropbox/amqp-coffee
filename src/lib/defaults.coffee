try
  clientVersion     = JSON.parse(require('fs').readFileSync("#{__dirname}/../../../package.json")).version
catch e
  clientVersion = '0.0.1'

{ MaxFrameSize } = require('./constants')

os = require('os')

module.exports =
  defaults :
    defaultExchangeName: ''
    amqp  : 5672
    amqps : 5671 # NOT SUPPORTED

  connection:
    host: "localhost"
    login: "guest"
    password: "guest"
    vhost: '/'
    port : 5672
    ssl: false
    sslPort: 5671
    heartbeat: 10000 # in ms
    reconnect: true
    reconnectDelayTime: 1000 # in ms
    hostRandom: false
    connectTimeout: 30000 # in ms
    channelMax: 0 # unlimited
    frameMax: MaxFrameSize

    clientProperties:
      version:    clientVersion
      platform:   os.hostname() + '-node-' + process.version
      product:    'node-amqp-coffee'


  basicPublish:
    mandatory:   false
    immediate:   false
    contentType: 'application/octet-stream'

  basicConsume:
    ###
    If the no­local field is set the server will not send messages to the
    connection that published them.
    ###
    noLocal: false

    ###
    If this field is set the server does not expect acknowledgements for
    messages. That is, when a message is delivered to the client the server
    assumes the delivery will succeed and immediately dequeues it. This
    functionality may increase performance but at the cost of reliability.
    Messages can get lost if a client dies before they are delivered to
    the application.
    ###
    noAck: true
    exclusive: false
    noWait: false
    arguments: {}

  basicQos:
    prefetchSize: 0
    ###
    RabbitMQ has reinterpreted this field. The original specification said:
    "By default the QoS settings apply to the current channel only. If
    this field is set, they are applied to the entire connection." Instead,
    RabbitMQ takes global=false to mean that the QoS settings should apply
    per-consumer (for new consumers on the channel; existing ones being
    unaffected) and global=true to mean that the QoS settings should apply
    per-channel.

    THIS IS CHANGED TO TRUE FOR RABBITMQ VERSION 3.3.0 AND UP IN CONSUMER
    ###
    global: false


  exchange:
    type: "direct"
    passive: false
    durable: false
    noWait: false
    autoDelete: true
    arguments: {}
    ###
    If set, the exchange may not be used directly by publishers, but only
    when bound to other exchanges.

    Internal exchanges are used to construct wiring that is not visible to applications.
    ###
    internal: false

  exchangeDelete:
    ifUnused: false
    noWait: false

  queueDelete:
    ###
    If set, the server will only delete the queue if it has no consumers. If the queue has consumers the server does does not delete it but raises a channel exception instead.
    ###
    ifUnused: false

    # If set, the server will only delete the queue if it has no messages.
    ifEmpty: true
    noWait: false
    arguments: {}

  queue:
    # Queue declare defaults
    autoDelete: true
    arguments: {}
    noWait:    false

    ###
    Exclusive queues may only be accessed by the current connection, and are deleted when that connection
    closes. Passive declaration of an exclusive queue by other connections are not allowed.

    * The server MUST support both exclusive (private) and non-exclusive (shared) queues.
    * The client MAY NOT attempt to use a queue that was declared as exclusive by another still-open
    connection. Error code: resource-locked
    ###
    exclusive: false

    ###
    If set when creating a new queue, the queue will be marked as durable. Durable queues remain active when a
    server restarts. Non-durable queues (transient queues) are purged if/when a server restarts. Note that
    durable queues do not necessarily hold persistent messages, although it does not make sense to send
    persistent messages to a transient queue.
    ###
    durable:   false

    ###
    If set, the server will reply with Declare-Ok if the queue already exists with the same name, and raise an
    error if not. The client can use this to check whether a queue exists without modifying the server state.
    When set, all other method fields except name and no-wait are ignored. A declare with both passive and
    no-wait has no effect. Arguments are compared for semantic equivalence.
    ###
    passive:   false
