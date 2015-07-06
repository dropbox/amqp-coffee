AMQP = require('../bin/src/amqp')

amqpClient = new AMQP {host: 'localhost'}, (error)->
  # queue functinos can be chained
  amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->


    amqpClient.publish 'amq.direct', 'testRoutingKey', 'testMessagewithConfirm', {confirm: true},  (err, res)->
      if err?
        return console.error "Message pushish error", err

      console.error "Message published"

      consumer = amqpClient.consume 'testQueue', {}, (message)->
        console.error "Got Message:", message.data

        consumer.close ()->
          console.error "Closed the consumer"

          amqpClient.close ()->
            console.error "Closed the connection"
