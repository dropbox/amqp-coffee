AMQP = require('../bin/src/amqp')

amqpClient = new AMQP {host: 'localhost'}, (error)->
  # queue functinos can be chained
  amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->
    amqpClient.queue({name:'testQueue2'}).declare().bind 'amq.direct','testRoutingKey2', ()->

      consumer = amqpClient.consume 'testQueue', {}, (message)->
        console.error "Got Message:", message
        consumer.close()
      , ()->

        # consumer = amqpClient.consume 'testQueue2', {}, (message)->
        #   console.error "Got Message:", message

