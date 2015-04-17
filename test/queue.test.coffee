should  = require('should')
async    = require('async')
_        = require('underscore')
proxy    = require('./proxy')
uuid = require('node-uuid').v4

AMQP = require('src/amqp')

describe 'Queue', () ->

  it 'test it can declare a queue 500', (done)->
    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()


    ], done

  it 'test it can declare a queue with no name 5001', (done)->
    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:''}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          should.exist r.queue
          next()

      (next)->
        queue.bind "amq.direct", uuid(), next

      (next)->
        queue.queueOptions.queue.should.not.eql ''
        next()

    ], (err, res)->
      should.not.exist err
      done()


  it 'test it can get a queues message count 501', (done)->
    amqp = null
    queue = null
    queuename = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queuename}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", queuename, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.messageCount (err, res)->
          res.should.eql 0
          next()

      (next)->
        amqp.publish "amq.direct", queuename, "test message", {confirm:true}, (e,r)->
          next()

      (next)->
        queue.messageCount (err, res)->
          res.should.eql 1
          next()

      (next)->
        queue.delete({ifEmpty:false}, next)

      (next)->
        amqp.close()
        next()

    ], done


  it 'test it can get a queues consumer count 502', (done)->
    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.consumerCount (err, res)->
          res.should.eql 0
          next()

      (next)->
        processor = ()->
          # i do nothing :)
        amqp.consume "testing", {} , processor, next

      (next)->
        queue.consumerCount (err, res)->
          res.should.eql 1
          next()

      (next)->
        queue.delete(next)

      (next)->
        amqp.close()
        next()

    ], done



  it 'test it can get a queues consumer count with connection trouble 503', (done)->

    thisproxy = new proxy.route(7008, 5672, "localhost")

    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port:7008, heartbeat: 1000}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.consumerCount (err, res)->
          res.should.eql 0
          thisproxy.interrupt()
          next()

      (next)->
        processor = ()->
          # i do nothing :)
        amqp.consume "testing", {} , processor, next

      (next)->
        queue.consumerCount (err, res)->
          res.should.eql 1
          next()

      (next)->
        queue.delete(next)

      (next)->
        amqp.close()
        thisproxy.close()
        next()

    ], done



  it 'test it can get a queues consumer count with connection trouble 504', (done)->
    this.timeout(5000)
    thisproxy = new proxy.route(7008, 5672, "localhost")

    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port:7008, heartbeat: 30000}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:"testing", autoDelete: false, durable: true}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e

          thisproxy.close()
          next()

      (next)->
        queue.consumerCount (err, res)->
          should.exist err
          thisproxy.interrupt()
          next()

        _.delay ()->
          thisproxy.listen()
        , 1000

      (next)->
        queue.consumerCount (err, res)->
          res.should.eql 0
          next()

      (next)->
        queue.delete(next)

      (next)->
        amqp.close()
        thisproxy.close()
        next()

    ], done


  it 'test it can declare a queue while its trying to close a temp channel 632', (done)->
    amqp = null
    queue = null
    channel = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
       channel = amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        channel.close()

        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

    ], done


  it 'test it can declare a queue while its trying to close a temp channel deferred 633', (done)->
    amqp = null
    queue = null
    channel = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
       channel = amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->

        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

        setTimeout channel.close, 1

    ], done



  it 'test it can delete a queue', (done)->
    amqp = null
    queue = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:"testing"}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.delete {}, (e,r)->
          should.not.exist e
          next()
    ], done


  it 'test we can bind a queue', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", queueName, (e,r)->
          should.not.exist e
          next()

    ], done

  it 'test we do not error on a double bind', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

    ], done


  it 'test we can unbind a queue 2885', (done)->
    this.timeout(1000000)
    amqp = null
    queue = null
    queueName = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing2", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.unbind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.unbind "amq.direct", "testing2", (e,r)->
          should.not.exist e
          next()
      (next)->
        _.delay ->
          openChannels = 0
          for channelNumber,channel of amqp.channels
            openChannels++ if channel.state is 'open'
          openChannels.should.eql 2
          next()
        , 10

      (next)->
        _.delay ->
          openChannels = 0
          for channelNumber,channel of amqp.channels
            openChannels++ if channel.state is 'open'
          openChannels.should.eql 1
          next()
        , 500
    ], done


  it 'test we can unbind a queue with no callbacks 2886', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "test1"
        queue.bind "amq.direct", "test2"
        queue.bind "amq.direct", "test3"
        _.delay next, 30

      (next)->
        queue.unbind "amq.direct", "test1"
        queue.unbind "amq.direct", "test2"
        queue.unbind "amq.direct", "test3"
        _.delay next, 500

      (next)->
        openChannels = 0
        for channelNumber,channel of amqp.channels
          openChannels++ if channel.state is 'open'
        openChannels.should.eql 1
        next()
    ], done



  it 'test we can unbind a queue with no callbacks on bad binds 2887', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    consumer = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName, passive:false, exclusive: true, autodelete: true}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare (e,r)->
          should.not.exist e
          next()

      (next)->
        consumer = amqp.consume queueName, {}, (message)->
          console.error messge
        , (cb)->
          next()

      (next)->
        queue.bind "amq.direct", "test1"
        queue.bind "amq.direct", "test2"
        queue.bind "amq.direct", "test3"
        queue.bind "amq.direct2", "test5"
        _.delay next, 30

      (next)->
        queue.unbind "amq.direct", "test1"
        queue.unbind "amq.direct", "test2"
        queue.unbind "amq.direct", "test3"
        queue.unbind "amq.direct", "test4"
        _.delay next, 500

      (next)->
        queue.unbind "amq.direct", "test1"
        queue.unbind "amq.direct", "test2"
        queue.unbind "amq.direct", "test3"
        queue.unbind "amq.direct", "test4"
        queue.unbind "amq.direct", "test4"
        _.delay next, 500

      (next)->
        consumer.close()
        _.delay next, 50

      (next)->
        openChannels = 0
        for channelNumber,channel of amqp.channels
          openChannels++ if channel.state is 'open'
        openChannels.should.eql 1
        next()
    ], done



  it 'test we can bind to a non-existing exchange and not leave channels open 2889', (done)->
    amqp = null
    queue = null
    queueName = uuid()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName, passive:false, exclusive: true, autodelete: true}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct2", "test1", ()-> next()
      (next)->
        queue.bind "amq.direct2", "test1", ()-> next()
      (next)->
        _.delay next, 100
      (next)->
        queue.bind "amq.direct2", "test1", ()-> next()
      (next)->
        queue.bind "amq.direct2", "test1", ()-> next()

      (next)->
        _.delay next, 500


      (next)->
        openChannels = 0
        for channelNumber,channel of amqp.channels
          openChannels++ if channel.state is 'open'
        openChannels.should.eql 1
        next()
    ], done



  it 'test we can timeout a queue channel and reopen it', (done)->
    this.timeout(2000)
    amqp = null
    queue = null
    queueName = uuid()
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        _.keys(amqp.channels).length.should.eql 2
        _.delay next, 500

      (next)->
        _.keys(amqp.channels).length.should.eql 1
        next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          _.keys(amqp.channels).length.should.eql 2
          next()

    ], done


  it 'test after a unbind error we could rebind, on a different channel', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    channel = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        channel = amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()

      (next)->
        queue.declare {passive:false}, (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        queue.unbind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

      (next)->
        channel.crash next

      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.not.exist e
          next()

    ], done



  it 'test we get a error on a bad bind', (done)->
    amqp = null
    queue = null
    queueName = uuid()
    channel = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        channel = amqp.queue {queue:queueName}, (e, q)->
          should.not.exist e
          should.exist q
          queue = q
          next()


      (next)->
        queue.bind "amq.direct", "testing", (e,r)->
          should.exist e
          e.replyCode.should.eql 404
          next()

    ], done

