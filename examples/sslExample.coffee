AMQP = require('../bin/src/amqp')

# amqpClient = new AMQP { ssl: true, host: 'localhost', sslOptions:{ ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (error)->

# amqpClient = new AMQP { ssl: true, host: 'owl.rmq.cloudamqp.com', vhost:'plfebzer', login:'**', password:'SY4ibvR8Ybs_bVicFQJCwsTO9r3b6L18'}, (error)->
#   amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->

#     console.error "cool"


amqpClient = new AMQP { ssl: true, host: 'owl.rmq.cloudamqp.com', vhost:'plfebzer', login:'plfebzer', password:'SY4ibvR8Ybs_bVicFQJCwsTO9r3b6L18'}, (error, connection)->


  amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->

    console.error "cool"


amqpClient.on 'ready' , ()->
  console.error "we're ready"