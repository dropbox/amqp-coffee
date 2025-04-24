AMQP = require('../bin/src/amqp')

# amqpClient = new AMQP { ssl: true, host: 'localhost', sslOptions:{ ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (error)->

amqpClient = new AMQP { ssl: true, host: 'owl.rmq.cloudamqp.com', vhost:<vhost>, login:<login>, password:<password>}, (error, connection)->


  amqpClient.queue({name:'testQueue'}).declare().bind 'amq.direct','testRoutingKey', ()->

    console.error "cool"


amqpClient.on 'ready' , ()->
  console.error "we're ready"
