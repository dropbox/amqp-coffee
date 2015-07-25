should  = require('should')
async    = require('async')
_        = require('underscore')
SslProxy    = require('./sslproxy')
Proxy = require('./proxy')

AMQP = require('src/amqp')

describe 'SSL Connection', () ->
  sslProxyConnection = null
  before (done)->
    sslProxyConnection = new SslProxy.route()
    done()

  it 'tests it can connect to localhost using ssl', (done) ->
    amqp = new AMQP {host:'localhost', ssl: true, sslOptions: {secureProtocol:"TLSv1_method", ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (e, r)->
      should.not.exist e
      done()

  it 'we can reconnect if the connection fails ssl', (done)->
    proxy = new Proxy.route(7051, 5671, "localhost")
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', sslPort: 7051, ssl: true, sslOptions: {secureProtocol:"TLSv1_method", ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (e, r)->
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

    ], ()->
      amqp.close()
      proxy.close()
      done()

  it 'we emit only one close event ssl', (done)->
    proxy = new Proxy.route(9010, 5671, "localhost")
    amqp  = null
    closes = 0

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', sslPort: 9010, ssl: true, sslOptions: {secureProtocol:"TLSv1_method", ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (e, r)->
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


  it 'we disconnect ssl', (done)->
    amqp = null

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', ssl: true, sslOptions: {secureProtocol:"TLSv1_method", ca: [require('fs').readFileSync('./test/ssl/testca/cacert.pem')]}}, (e, r)->
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

