amqp-coffee
===========

[![Build Status](https://travis-ci.org/dropbox/amqp-coffee.png?branch=master)](https://travis-ci.org/dropbox/amqp-coffee) Node.JS AMQP 0.9.1 Client

## Sample

```coffeescript
AMQP = require('amqp-coffee') # path to this

testData = "the data to be published..  I am a string but could be anything"

amqpConnection = new AMQP {host:'localhost'}, (e, r)->
  if e?
    console.error "Error", e

  amqpConnection.queue {queue: "queueName"}, (e,q)->
    q.declare ()->
      q.bind "amq.direct", "queueName", ()->

      amqpConnection.publish "amq.direct", "queueName", testData, {confirm: true}, (err, res)->
        console.log "Message published"

      consumer = amqpConnection.consume "queueName", {prefetchCount: 2}, (message)->
        console.log message.data.toString()
        message.ack()

      , (e,r)->
        console.log "Consumer setup"
        amqpConnection.publish "amqp.direct", "queueName", "message contents", {deliveryMode:2, confirm:true}, (e, r)->
          if !e? then console.log "Message Sent"
```

## Methods

* Class: amqp-coffee
  * [new amqp-coffee([connectionOptions],[callback])](#new-amqp-coffeeconnectionoptionscallback)
  * [connection.queue([queueOptions],[callback])](#connectionqueuequeueoptionscallback)
    * [queue.declare([queueOptions],[callback])](#queuedeclarequeueoptionscallback)
    * [queue.delete([queueDeleteOptions],[callback])](#queuedeletequeuedeleteoptionscallback)
    * [queue.bind(exchange, routingkey, [queueName], [callback])](#queuebindexchange-routingkey-queuename-callback)
    * [queue.unbind(exchange, routingKey, [queueName], [callback])](#queueunbindexchange-routingkey-queuename-callback)
    * [queue.messageCount(queueOptions, callback)](#queuemessagecountqueueoptions-callback)
    * [queue.consumerCount(queueOptions, callback)](#queuconsumercountqueueoptions-callback)
  * [connection.exchange([exchangeArgs],[callback])](#connectionexchangeexchangeargscallback)
    * [exchange.declare([exchangeArgs],[callback])](#exchangedeclareexchangeargscallback)
    * [exchange.delete([exchangeDeleteOptions], [callback])](#exchangedeleteexchangedeleteoptions-callback)
  * [connection.publish(exchange, routingKey, data, [publishOptions], [callback])](#connectionpublishexchange-routingkey-data-publishoptions-callback)
  * [connection.consume(queueName, options, messageListener, [callback])](#connectionconsumequeuename-options-messagelistener-callback)
    * [consumer.setQos(prefetchCount, [callback])](#consumersetqosprefetchcount-callback)
    * [consumer.cancel([callback])](#consumercancelcallback)
    * [consumer.resume([callback])](#consumerresumecallback)
    * [consumer.pause([callback])](#consumerpausecallback)
    * [consumer.close([callback])](#consumerclosecallback)
  * [connection.close()](#connectionclose)


## new amqp-coffee([connectionOptions],[callback])
Creates a new amqp Connection.  The connection is returned directly and in the callback.  The connection extends EventEmitter.

The callback is called if there is a sucessful connection OR a unsucessful connection and connectionOptions.reconnect is false.  If connectionOptions.reconnect is false, you will get a error back in the callback.  If no callback is specified it will be emitted.

The `connectionOptions` argument should be an object which specifies:
* `host`: a string of the hostname OR an array of hostname strings OR an array of hostname objects {host, port}
* `port`: a integer of the port to connect to.  Not used if host is an object.
* `login`: "guest"
* `password`: "guest"
* `vhost`: '/'
* `port`: 5672
* `heartbeat`: 10000 # in ms
* `reconnect`: true
* `reconnectDelayTime`: 1000 # in ms
* `hostRandom`: false
* `connectTimeout: 30000 # in ms, this is only used if reconnect is false
* `clientProperties` : {version: clientVersion, platform, product}
* `ssl`: false
* `sslOptions` : {} # tls options like cert, key, ca, secureProtocol, passphrase

Host Examples
```coffeescript
host: 'localhost'
host: {host: 'localhost', port: 15672}
host: ['localhost','yourhost']
host: [{host: 'localhost', port:15672}, {host: 'localhost', port:15673}]
```
Sample Connection
```coffeescript
amqp-coffee = require('amqp-coffee')

amqp = new amqp-coffee {host: 'localhost'}, (error, amqpConnection)->
   assert(amqp == amqpConnection)
```

#### Reconnect Flow
On a connection close, we start the reconnect process if `reconnect` is true.
After the `reconnectDelayTime` the hosts are rotated if more than one `host` is specified.
A new connection is atempted, if the connection is not sucessful this process repeats.
After a connection is re-establed, all of the channels are reset, this atempts to reopen that channel.  Different channel types re-establish there channels differently.
* Publisher channels, will only reconnect when a publish is atempted.
* Consumer channels will reconnect and resume consuming.  If it was a autoDelete queue, this could fail.  Make sure you listen to the ready even on the connection to re-set up and consume any autoDelete queues.
* Queue / Exchange channels are recreated on demand.

### Event: 'ready'
Emitted when the connection is open successfully.  This will be called after each successful reconnect.

### Event: 'close'
Emitted when a open connection leaves the ready state and is closed.

### Event: 'error'
Very rare, only emitted when there's a server version mismatch


### connection.queue([queueOptions],[callback])

This returns a channel that can be used to declare, bind, unbind, or delete queus.  This on its own does NOT declare a queue.
When creating a queue class using connection.queue, you can specify options that will be used in all the child methods.

The `queueOptions` argument should be an object which specifies:
* `queue`: a string repensenting the queue name, can also be empty to use a autogenerated queue name
* `autoDelete`: default: true
* `noWait`: default: false
* `exclusive`: default: false. The queue can only be used by the current connection.
* `durable`: default: false
* `passive`: default: false.  The queue creation will not fail if the queue already exists.

Both queues and exchanges use "temporary" channels, which are channels amqp-coffee manages specifically for declaring, binding, unbinding, and deleting queues and exchanges.  After 2 seconds of inactivity these channels are closed, and reopened on demand.

#### queue.declare([queueOptions],[callback])

  Will take a new set of queueOptions, or use the default.
  Issues a queueDeclare and waits on queueDeclareOk if a callback is specified.

```coffeescript
amqp = new AMQP, ()->
  amqp.queue({queue:'queueToCreate'}, (err, Queue)->
    Queue.declare (err, res)->
      # the queue is now declared
```

To use a auto-generated queue name

```coffeescript
amqp = new AMQP, ()->
  amqp.queue({queue:''}, (err, Queue)->
    Queue.declare (err, res)->
      queueName = res.queue
```

#### queue.delete([queueDeleteOptions],[callback])

The `queueDeleteOptions` argument should be an object which specifies:
* `queue`: name of the queue
* `ifUnused`: default: false
* `ifEmpty`: default: true
* `noWait`: default: false

#### queue.bind(exchange, routingkey, [queueName], [callback])
Sets up bindings from an already existing exchange to an already existing queue

#### queue.unbind(exchange, routingKey, [queueName], [callback])
Tears down an already existing binding

#### queue.messageCount(queueOptions, callback)
Rabbitmq specific, re-declares the queue and returns the messageCount from the response

#### queue.consumerCount(queueOptions, callback)
Rabbitmq specific, re-declares the queue and returns the consumerCount from the response

### connection.exchange([exchangeArgs],[callback])
This returns a channel that can be used to declare, bind, unbind, or delete exchanges.  This on its own does NOT declare a exchange.
When creating an exchange class using connection.exchange, you can specify options that will be used in all the child methods.

The `exchangeArgs` argument should be an object which specifies:
* `exchange`: a string representing the exchange name
* `type`: "direct"
* `passive`: false
* `durable`: false
* `noWait`: false
* `autoDelete`: true
* `internal`: false

Both queues and exchanges use "temporary" channels, which are channels amqp-coffee manages specifically for declaring, binding, unbinding, and deleting queues and exchanges.  After 2 seconds of inactivity these channels are closed, and reopened on demand.

#### exchange.declare([exchangeArgs],[callback])
#### exchange.delete([exchangeDeleteOptions], [callback])

The `exchangeDeleteOptions` argument should be an object which specifies:
* `exchange`: the name of the exchange
* `ifUnused`: false
* `noWait`: false

### connection.publish(exchange, routingKey, data, [publishOptions], [callback])

amqp-coffee manages publisher channels and sets them up on the first publish.  Confirming is a state a channel must be put in, so a channel is needed for confimed publishes and one for non confimed publishes.  They are only created on demand.  So you should have a maximum of 2 channels publishing for a single connection.

New in 0.1.20 if you set the mandatory or immediate flag with the confirm flag we add a tracking header on that message headers.x-seq which is a numeric representation of that message just like the sequence number.  That flag is used to re-connect a messages that has failed publishing and come back as a "basicReturn" to a already existing callback.  This allows you to publish to a queue that may not exist and get a bounce if it doesnt.  Or if a queue is in a bad state the message will fail routing and come back.

* `exchange`: string of the exchange to publish to
* `routingKey`: string to use to route the message
* `data`: any type of data, if it is an object it will be converted into json automatically and unconverted on consume.  Strings are converted into buffers.
* `publishOptions`: All parameters are passed through as arguments to the publisher.
  * `confirm`: false
  * `mandatory`: false
  * `immediate`: false
  * `contentType`: 'application/octet-stream'



### connection.consume(queueName, options, messageListener, [callback])

consumers use their own channels and are re-subscribed to on reconnect. Returns a consumer object.

* `queueName`: string of the queue to subscribe to
* `options`:
  * `noLocal`: false
  * `noAck`: true
  * `exclusive`: false
  * `noWait`: false
  * `prefetchCount` : integer.  If specified the consumer will enter qos mode and you will have to ack messages.  If specified `noAck` will be set to false
  * `consumerTag`: optional string.  If not specified one will be generated for you.
* `messageListener`: a function (message)
* `callback`: a function that is called once the consume is setup

messageListener is a function that gets a message object which has the following attributes:
* `data`: a getter that returns the data in its parsed form, eg a parsed json object, a string, or the raw buffer
* `raw`: the raw buffer that was returned
* `properties`:  headers specified for the message
* `size`: message body size
* `ack()`: function : only used when prefetchCount is specified
* `reject()`: function: only used when prefetchCount is specified
* `retry()`: function: only used when prefetchCount is specified

```coffeescript
listener = (message)->
  # we will only get 1 message at a time because prefetchCount is set to 1
  console.log "Message Data", message.data
  message.ack()

amqp = new AMQP ()->
  amqp.queue {queue: 'testing'}, (e, queue)->
    queue.declare ()->
      queue.bind 'amq.direct', 'testing', ()->
        amqp.publish 'amq.direct', 'testing', 'here is one message 1'
        amqp.publish 'amq.direct', 'testing', 'here is one message 2'

      amqp.consume 'testing', {prefetchCount: 1}, listener, ()->
        console.log "Consumer Ready"
```
#### consumer Event: error
Errors will be emitted from the consumer if we can not consumer from that queue anymore.  For example if you're consuming a autoDelete queue and you reconnect that queue will be gone.  It will return the raw error message with code as the message.

#### consumer.setQos(prefetchCount, [callback])

Will update the prefetch count of an already existing consumer; can be used to dynamically tune a consumer.

#### consumer.cancel([callback])
Sends basicCancel and waits on basicCancelOk

#### consumer.pause([callback])
consumer.cancel

#### consumer.close([callback])
Calls consumer.cancel, if we're currently consuming.  Then calls channel.close and calls the callback as soon as the channel close is sent, NOT when channelCloseOk is returned.

#### consumer.resume([callback])
consumer.consume, sets up the consumer with a new consumer tag

#### consumer.flow(active, [callback])
An alias for consumer.pause (active == false) and consome.resume (active == true)

### connection.close()


More documentation to come.  The tests are a good place to reference.

## Differences between amqp-coffee and node-amqp

First of all this was heavily inspired by https://github.com/postwait/node-amqp

Changes from node-amqp
- the ability to share channels intelligently. ( if you are declaring multiple queues and exchanges there is no need to use multiple channels )
- auto channel closing for transient channels ( channels used for declaring and binding if they are inactive )
- consumer reconnecting
- fixed out-of-order channel operations by ensuring things are writing in order and not overwriting buffers that may not have been pushed to the network.
- switch away from event emitters for consumer acks
- everything that can be async is async
- native bson support for messages with contentType application/bson
- ability to delete, bind, and unbind a queue without having to know everything about the queue like auto delete etc...
- can get the message and consumer count of a queue
- can turn flow control on and off for a consumer (pause, resume) receiving messages.
- rabbitmq master queue connection preference.  When you connect to an array of hosts that have queues that are highly available (HA) it can talk to the rabbit api and make sure it talks to the master node for that queue.  You can get way better performance with consumer acks.
