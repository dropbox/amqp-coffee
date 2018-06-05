AMQP = require('../bin/src/amqp')

amqpClient = new AMQP {host: 'localhost'}, (error)->
  # queue functinos can be chained
  amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->

    expectedMessages = 3
    recievedMessages = 0

    consumer = amqpClient.consume 'testQueue', {}, (message)->
      console.error "Got Message:", message.data
      recievedMessages++

      if recievedMessages == expectedMessages
        console.error "Received all expected messages"

        consumer.close ()->
          console.error "Closed the consumer"

          amqpClient.close ()->
            console.error "Closed the connection"

    amqpClient.publish 'amq.direct', 'testRoutingKey', 'testMessage'
    amqpClient.publish 'amq.direct', 'testRoutingKey', {json: 'this is a json object'}
    amqpClient.publish 'amq.direct', 'testRoutingKey', Buffer.alloc(3)

