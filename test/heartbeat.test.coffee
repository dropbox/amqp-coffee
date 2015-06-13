should  = require('should')
async    = require('neo-async')
_        = require('lodash')
Proxy    = require('./proxy')

AMQP = require('src/amqp')

describe 'Connection Heartbeats', () ->
  it 'we can get a heartbeat 541', (done)->
    this.timeout(5000)
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 5672, heartbeat: 1000}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.parser.once 'heartbeat', ()->
          next()

      (next)->
        amqp.close()
        next()

    ], done


  it 'we reset the heartbeat timer while the connection is doing other things', (done)->
    this.timeout(60000)
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 5672, heartbeat: 1000}, (e, r)->
          should.not.exist e
          next()

      (next)->
        queuename = "queuename"
        heartbeat = false
        stage = 2
        amqp.on 'close', ()->
          if stage is 2
            throw new Error('connection closed')

        doThings = ()->

          amqp.queue {queue:queuename}, (e, q)->
            should.not.exist e
            should.exist q

            q.declare {passive:false}, (e,r)->
              should.not.exist e
              doThings() if !heartbeat

        doThings()

        _.delay next, 3000

      (next)->
        stage = 3
        amqp.close()
        next()

    ], done


  it 'we disconnect and we dont reconnect because of the heartbeat 540', (done)->
    this.timeout(60000)
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 5672, heartbeat: 1000}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        _.delay next, 3000

      (next)->
        amqp.state.should.eql 'destroyed'
        amqp.close()
        next()

    ], done


  it 'hearthbeat missing reconnects 574', (done)->

    this.timeout(60000)
    proxy = new Proxy.route(7070, 5672, "localhost")
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 7070}, (e, r)->
          should.not.exist e
          next()

      (next)->
        _.delay ()->
          amqp._missedHeartbeat()
        , 100

        amqp.once 'close', next

      (next)->
        amqp.once 'ready', next

      (next)->
        amqp.close()
        proxy.close()
        next()

    ], done



  it 'we send heartbeats 575', (done)->
    this.timeout(7000)
    amqp = null
    consumer = null
    queueName = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e

        amqp.once 'ready', next

      (next)->
        consumer = new AMQP {host:'localhost', heartbeat: 1000}, (e, r)->
          should.not.exist e

        consumer.once 'ready', next

      (next)->
        amqp.queue {queue: ''}, (err, queueInfo)->
          should.not.exist err

          queueInfo.declare (err, queueInfo)->
            should.not.exist err
            queueName = queueInfo.queue
            next()

      (next)->

        consumer.consume queueName, {}, ()->

        shouldStop = false

        setTimeout ()->
          shouldStop = true
        , 4000

        async.until ()->
          return shouldStop
        , (done)->
          amqp.publish '', queueName, 'message', done
        , next

      (next)->
        amqp.close()
        consumer.close()
        next()

    ], done


