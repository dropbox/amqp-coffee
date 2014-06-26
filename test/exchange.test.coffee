should  = require('should')
async    = require('async')
_        = require('underscore')
proxy    = require('./proxy')
uuid = require('node-uuid').v4

AMQP = require('src/amqp')

describe 'Exchange', () ->

  it 'test it can declare a exchange', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {exchange:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()
    ], done


  it 'test it can declare a exchange using name', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {name:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()
    ], done



  it 'test it can declare a exchange with no options', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {name:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()
    ], done


  it 'test it can declare a exchange with no callback', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange({name:"nocallbacktesting"}).declare (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()
    ], done



  it 'test it can fail declaring an exchange', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {idontbelong:"testsing"}, (e, exc)->
          should.exist e
          next()


      (next)->
        amqp.close()
        next()

    ], done


  it 'test it can delete a exchange', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {exchange:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        exchange.delete {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()

    ], done



  it 'test it can delete a exchange with no options', (done)->
    this.timeout(5000);
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {exchange:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        exchange.delete (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.close()
        next()

    ], done



  it 'test we can timeout a exchange channel and reopen it', (done)->
    this.timeout(2000)
    amqp = null
    exchange = null
    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.exchange {exchange:"testsing"}, (e, exc)->
          should.not.exist e
          should.exist exc
          exchange = exc
          next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          next()

      (next)->
        _.keys(amqp.channels).length.should.eql 2
        _.delay next, 500

      (next)->
        _.keys(amqp.channels).length.should.eql 1
        next()

      (next)->
        exchange.declare {}, (e,r)->
          should.not.exist e
          _.keys(amqp.channels).length.should.eql 2
          next()

      (next)->
        amqp.close()
        next()

    ], done
