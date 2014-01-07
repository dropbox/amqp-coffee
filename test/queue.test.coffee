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


  it 'test we can unbind a queue', (done)->
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
        queue.unbind "amq.direct", "testing", (e,r)->
          should.not.exist e
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
