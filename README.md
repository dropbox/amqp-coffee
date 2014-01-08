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
