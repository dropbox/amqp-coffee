amqp-coffee
===========

[![Build Status](https://travis-ci.org/dropbox/amqp-coffee.png?branch=master)](https://travis-ci.org/dropbox/amqp-coffee)

node.JS AMQP 0.9.1 Client

## Sample

```coffeescript
AMQP = require('amqp-coffee') # path to this

amqpConnection = new AMQP {host:'localhost'}, (e, r)->
  should.not.exist e

  amqpConnection.queue {queue: "queueName"}, (e,q)->
    q.declare ()->
      q.bind "amq.direct", queue, next

    amqpConnection.publish "amq.direct", queue, testData, {confirm: true}, (err, res)->
      console.log "Message publishes"

    consumer = amqpConnection.consume "queueName", {prefetchCount: 2}, (message)->
      console.log message.data
      message.ack()

    , (e,r)->
      console.log "Consumer setup"
      amqpConnection.publish "amqp.direct", "queueName", "message contents", {deliveryMode:2, confirm:true}, (e, r)->
        if !e? then console.log "Message Sent"
```


A connection manages which host to connect to, and reconnects.  Connection is the root class of amqp-coffee
Connection defaults
```coffee-script
connectionArgs
  # defaults
  host: "localhost"
  login: "guest"
  password: "guest"
  vhost: '/'
  port : 5672
  heartbeat: 10000 # in ms
  reconnect: true
  reconnectDelayTime: 1000 # in ms
  hostRandom: false
```

Host can be an array or strings or objects {host, port}, if its an array the first host is used unless hostRandom is true.  If there are multiple and the first is unavaliable it will move the second and so on.  We have found that
with rabbitmq and durable persistant queues with high availablity, publishing to a queues "master node" is significatly faster than publishing to just a random host.


## Connection Methods

```coffee-script
# callback is always optional
constructor : (connectionArgs, callback)->
queue: (queueArgs, callback)->
exchange: (exchangeArgs, callback)->
publish: (exchange, routingKey, data, publishOptions, callback)->
close: ()->
```

## Queue


```coffee-script

 queueOptions:
    # required
    name: 

    #defaults
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


  queueDeleteOptions:
    ###
    If set, the server will only delete the queue if it has no consumers. If the queue has consumers the server does does not delete it but raises a channel exception instead.
    ###
    ifUnused: false

    # If set, the server will only delete the queue if it has no messages.
    ifEmpty: true
    noWait: false
    arguments: {}

# Example
amqp = new AMQP {}, (err, res)->
  amqp.queue({name: 'testing'}).declare ()->
    amqp.queue({name: 'testing'}).bind('amqp.direct','testing123')
    
    amqp.queue {name: 'testing'}, (err, queue)->
      queue.bind('amqp.direct','testing456')

# Methods
# does nothing but sets defaults on the class
constructor: (queueOptions, [callback])->
# actually declares the queue, using queueOptions.name
declare: (queueOptions, [callback])->
# sets up bindings from a already existing exchange, to an already existing queue
bind: (exchange, routingKey, [callback])->
# tears down an already existing binding
unbind: (exchange, routingKey, [callback])->
# rabbitmq specific, re-declares the queue and returns the messageCount from the response
messageCount: (queueOptions, [callback])->
# rabbitmq specific, re-declares the queue and returns the consumerCount from the response
consumerCount: (queueOptions, [callback])->
# deletes a already existing queue, all thts necessary here is queueDeleteOptions.name
delete: (queueDeleteOptions, [callback])->

```


## Exchange

```coffee-script

constructor: (exchangeOptions, [callback])->


```


More documentation to come.  The tests are a good place to reference.

## Differences between amqp-coffee and node-amqp

First of all this was heavily inspired by https://github.com/postwait/node-amqp

Changes from node-amqp
- the ablity to share channels intelligently. ( if you are declaring multiple queues and exchange no need to use multiple channels )
- auto channel closing for transient channels ( channels used for declaring and binding if they are inactive )
- consumer reconnecting
- fixed out of order channel operations by ensuring things are writing in order and not overwriting buffers that may not have been pushed to the network.
- switch away from event emitters for consumer acks
- everything that can be async is async
- native bson support for messages with contentType application/bson
- abality to delete, bind, and unbind a queue without having to know everything about the queue like auto delete etc...
- can get the message and consumer count of a queue
- can turn flow control on and off for a consumer (pause, resume) recieving messages.
- rabbitmq master queue connection preference.  When you connect to an array of hosts that have queue's that are highly available (HA) it can talk to the rabbit api and make sure it talks to the master node for that queue.  You can get way better performance with consumer acks.
