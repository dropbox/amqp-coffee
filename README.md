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

This was heavily inspired by https://github.com/postwait/node-amqp
