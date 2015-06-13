should  = require('should')
async    = require('neo-async')
_        = require('lodash')
Proxy    = require('./proxy')

uuid = require('node-uuid').v4

AMQP = require('src/amqp')

describe 'Rabbit Plugin', () ->
  it 'tests we can connect with a master node for a non-existant queue', (done) ->
    this.timeout(5000)
    amqp = null
    queue = uuid()

    async.series [
      (next)->

        amqp = new AMQP  {host:['127.0.0.1', 'localhost'], rabbitMasterNode:{queue}}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        messageProcessor = ()->

        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ], done

  it 'tests we can try to connect to a with a masterNode with no api server', (done) ->
    amqp = null
    queue = uuid()

    async.series [
      (next)->

        amqp = new AMQP  {host:['idontexist.testing'], rabbitMasterNode:{queue}}, (e, r)->
          should.exist e
          next()

    ], done


  it 'tests we can not connect to the master node', (done) ->
    amqp = null
    queue = "masterNodeTest2"

    async.series [
      (next)->

        amqp = new AMQP  {host:['localhost'], rabbitMasterNode:{queue}}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete: false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.close()
        next()

      (next)->
        amqp = new AMQP  {host:['127.0.0.1'], rabbitMasterNode:{queue}}, (e, r)->
          should.exist e
          next()

    ], done


  it 'tests we can connect with a master node for a existing queue', (done) ->
    amqp = null
    queue = "masterNodeTest"

    async.series [
      (next)->

        amqp = new AMQP  {host:['127.0.0.1', 'localhost'], rabbitMasterNode:{queue}}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete: false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.close()
        next()

      (next)->
        amqp = new AMQP  {host:['127.0.0.1', 'localhost'], rabbitMasterNode:{queue}}, (e, r)->
          should.not.exist e
          next()

      (next)->
        messageProcessor = ()->

        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.connectionOptions.host.should.eql 'localhost'
        next()

    ], done

