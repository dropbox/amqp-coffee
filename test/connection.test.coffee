should  = require('should')
async    = require('neo-async')
_        = require('lodash')
Proxy    = require('./proxy')

AMQP = require('src/amqp')

describe 'Connection', () ->
  it 'tests it can connect to localhost', (done) ->
    amqp = new AMQP {host:'localhost'}, (e, r)->
      should.not.exist e
      done()

  it 'tests it can connect to nested hosts array', (done) ->
    amqp = new AMQP {host:[['localhost']]}, (e, r)->
      should.not.exist e
      done()

  it 'we fail connecting to an invalid host', (done) ->
    amqp = new AMQP {reconnect:false, host:'iamnotthequeueyourlookingfor'}, (e, r)->
      should.exist e
      amqp.close()
      done()

  it 'we fail connecting to an invalid no callback', (done) ->
    amqp = new AMQP {reconnect:false, host:'iamnotthequeueyourlookingfor'}
    amqp.on 'error', ()->
      done()

  it 'we can reconnect if the connection fails 532', (done)->
    proxy = new Proxy.route(7001, 5672, "localhost")
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 7001}, (e, r)->
          should.not.exist e
          next()

      (next)->
        proxy.interrupt()
        next()

      (next)->
        amqp.queue {queue:"test"}, (e, q)->
          should.not.exist e
          should.exist q
          next()

    ], done


  it 'we disconnect', (done)->
    # proxy = new proxy.route(9001, 5672, "localhost")
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()

      (next)->
        setTimeout next, 100

      (next)->
        amqp.state.should.eql 'destroyed'
        next()

    ], done


  it 'we can connect to an array of hosts', (done)->
    # proxy = new proxy.route(9001, 5672, "localhost")
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:['localhost','127.0.0.1']}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()

    ], done



  it 'we emit only one close event', (done)->
    proxy = new Proxy.route(9010, 5672, "localhost")
    amqp  = null
    closes = 0

    async.series [
      (next)->
        amqp = new AMQP {host:['localhost','127.0.0.1'], port: 9010}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.on 'close', ()->
          closes++
          amqp.close()

          _.delay ()->
            closes.should.eql 1
            amqp.close()
            done()
          , 300


        proxy.close()
        next()

    ], (e,r)->
      should.not.exist e


  it 'we can reconnect to an array of hosts if the connection fails', (done)->
    this.timeout(5000)
    proxy = new Proxy.route(9009, 5672, "localhost")
    amqp  = null

    async.series [
      (next)->
        amqp = new AMQP {host:['localhost','127.0.0.1'], port: 9009}, (e, r)->
          should.not.exist e
          next()

      (next)->
        proxy.interrupt()
        next()

      (next)->
        amqp.queue {queue:"test"}, (e, q)->
          should.not.exist e
          should.exist q
          next()

      (next)->
        amqp.close()
        proxy.close()
        next()

    ], done


  it 'we can connect to an array of hosts randomly', (done)->

    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {hostRandom: true, host:['localhost','127.0.0.1']}, (e, r)->
          should.not.exist e
          next()

    ], done


  it 'we can timeout connecting to a host', (done)->
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {reconnect:false, connectTimeout: 100, host:'test.com'}, (e, r)->
          should.exist e
          next()

    ], done


