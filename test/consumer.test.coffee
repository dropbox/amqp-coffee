should  = require('should')
async    = require('neo-async')
_        = require('lodash')
proxy    = require('./proxy')
uuid = require('node-uuid').v4

AMQP = require('src/amqp')

bson = require 'bson'
BSON = new bson.BSONPure.BSON()

{ MaxFrameSize, FrameType, HeartbeatFrame }   = require('../src/lib/config').constants

describe 'Consumer', () ->
  this.timeout(10000)
  it 'test we can consume a queue and get a message', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()

    messageProcessor = (m)->
      m.data.should.eql testData
      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData, {confirm: true}, next
    ]

  it 'test we can consume a queue and get a message with headers 163', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()

    messageProcessor = (m)->
      m.data.should.eql testData
      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData, {confirm: true}, next
    ]



  it 'test we can set up a bunch of consumes 164', (done)->

    amqp = null
    queue = uuid()
    messageProcessor = ()->
      # do nothing

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...20], (i, done)->
          amqp.consume queue, {}, messageProcessor, (e,r)->
            should.not.exist e
            done()
        , next

    ], done


  it 'test we fail correctly with a exclusive consumer 165', (done)->

    amqp = null
    queue = uuid()
    messageProcessor = ()->
      # do nothing

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {exclusive: true}, messageProcessor, (e,r)->
          should.not.exist e
          next()


      (next)->
        amqp.consume queue, {exclusive: true}, messageProcessor, (e,r)->
          should.exist e
          next()

    ], (err, res)->
      should.not.exist err
      done()

  it 'test we can consume a queue and get a message, and keep it intact', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()

    messageProcessor = (m)->
      message = m.data
      message.should.eql testData

      message = {test:false}
      message.should.not.eql testData

      message = m.data
      message.should.eql testData

      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData, {confirm: true}, next
    ]


  it 'test we can consume a queue and get some messages, and keep them intact 587', (done)->

    testData = [{test:"message1"},{test:"message2"}]
    amqp = null
    queue = uuid()

    messageN = 0
    messages = []

    messageProcessor = (m)->
      thisMessage = messageN
      messageN++

      message = m.data
      message.should.eql testData[thisMessage]

      message = {test:false}
      message.should.not.eql testData[thisMessage]

      message = m.data
      message.should.eql testData[thisMessage]

      messages.push m

      if messageN is 2
        mcheck = 0
        for message in messages
          message.data.should.eql testData[mcheck]
          mcheck++
        done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData[0], {confirm: true}, next

      (next)->
        amqp.publish "amq.direct", queue, testData[1], {confirm: true}, next

    ]



  it 'test we can consume a queue and get a big message 588', (done)->

    testData = new Buffer(MaxFrameSize*3.5)
    amqp = null
    queue = uuid()

    messageProcessor = (m)->

      m.data.length.should.eql testData.length
      m.data.should.eql testData
      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData, {confirm: true}, next
    ]


  it 'test we can consume a queue several really big messages 173', (done)->
    this.timeout(120000)

    testData = new Buffer(10*1024*1024) # 10 mb ish

    amqp = null
    queue = uuid()
    messagesToSend = 10
    messagesRecieved = 0

    messageProcessor = (m)->
      m.data.length.should.eql testData.length
      m.data.should.eql testData
      messagesRecieved++
      done() if messagesRecieved is messagesToSend

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        async.forEach [0...messagesToSend], (i, next)->
          amqp.publish "amq.direct", queue, testData, {confirm: false}, next
        , next
    ], (e,r)->
      should.not.exist e

  it 'test we can consume a queue and get a JSON big message', (done)->
    t = new Buffer(MaxFrameSize*3.5)
    testData = {t: t.toString()}
    amqp = null
    queue = uuid()

    messageProcessor = (m)->
      m.data.should.eql testData
      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        amqp.publish "amq.direct", queue, testData, {confirm: true}, next
    ]



  it 'test we can consume a queue and get a BSON big message 142', (done)->
    t = new Buffer(MaxFrameSize*3.5)
    testData = {t: t.toString()}
    amqp = null
    queue = uuid()

    messageProcessor = (m)->
      m.data.should.eql testData
      done()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        amqp.consume queue, {}, messageProcessor, (e,r)->
          should.not.exist e
          next()

      (next)->
        # testData = BSON.serialize testData
        amqp.publish "amq.direct", queue, BSON.serialize(testData), {contentType:"application/bson", confirm: true}, next
    ], (e,r)->
      should.not.exist e



  it 'test we can consume and get max messages', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++
      if messagesRecieved is 1
        _.delay ()->
          messagesRecieved.should.eql 2
          m.ack()
        ,50
      if messagesRecieved is 3
        _.delay ()->
          messagesRecieved.should.eql 3
          done()


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        amqp.consume queue, {prefetchCount: 2}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]



  it 'test we can consume and change prefetchCount 700', (done)->
    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    queueConnection = null
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++
      if messagesRecieved is 1
        _.delay ()->
          messagesRecieved.should.eql 2
          consumer.setQos 5, ()->
            m.ack()
        ,50

      if messagesRecieved is 3
        _.delay ()->
          messagesRecieved.should.eql 6

          queueConnection.delete {isEmpty: false}
          amqp.close()

          done()
        , 50

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          queueConnection = q
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->

        consumerOptions = {prefetchCount: 2}

        if amqp.serverProperties?.product == 'RabbitMQ' and \
         ( amqp.serverProperties?.capabilities?.per_consumer_qos == true or \
         amqp.serverProperties?.version == "3.3.0" )

          consumerOptions.global = true

        consumer = amqp.consume queue, consumerOptions, messageProcessor, (e,r)->
          should.not.exist e
          next()

    ]

  it 'test we can consume a bunch of messages 215', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 500
        _.delay ()->
          messagesRecieved.should.eql 500
          done()
        , 50


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...500], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        amqp.consume queue, {prefetchCount: 500}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]



  it 'test we can use flow control 496', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 10
        consumer.pause()
        _.delay ()->
          messagesRecieved.should.eql 10
          consumer.resume()
        , 500

      _.delay ()->
        m.ack()
      , 50

      if messagesRecieved is 50
        _.delay ()->
          messagesRecieved.should.eql 50
          done()
        , 50

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {autoDelete:false, queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...50], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 10}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]


  it 'test we can consume and reject a message', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      _.delay ()->
        m.reject()
      ,50
      if messagesRecieved is 5
        _.delay ()->
          messagesRecieved.should.eql 5
          done()


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...5], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        amqp.consume queue, {prefetchCount: 2}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]



  it 'test we can consume and retry a message', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved <= 2
        m.retry()
      else
        m.ack()

      if messagesRecieved is 2
        _.delay ()->
          messagesRecieved.should.eql 5
          done()
        , 200

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...3], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        amqp.consume queue, {prefetchCount: 2}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]


  it 'test we can consume and deal with a crash mid stream 705', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++
      if messagesRecieved is 1
        _.delay ()->
          messagesRecieved.should.eql 2
          consumer.crash()
          m.ack()
        ,50
      if messagesRecieved is 4
        _.delay ()->
          messagesRecieved.should.eql 4
          done()


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete:false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...3], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 2}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]


  it 'test we can consume and cancel the consumer', (done)->

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 1
        consumer.cancel ()->
          m.ack()

        _.delay ()->
          messagesRecieved.should.eql 1
          done()
        , 300


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost'}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete:false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 1}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]



  it 'test we can consume and interrupt a autoDelete queue 854', (done)->

    thisproxy = new proxy.route(7007, 5672, "localhost")
    amqp = null

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 5
        thisproxy.interrupt()

      m.ack()


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 7007}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete:true}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 1}, messageProcessor, (e,r)->
          should.not.exist e
          next()

        consumer.on 'error', (error)->
          should.exist error
          error.error.replyCode.should.eql 404
          done()

    ]


  it 'test we can close a consumer channel 854.5', (done)->

    amqp = null

    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 5
        consumer.close()

        _.delay ()->
          (messagesRecieved > 6).should.eql false
          done()
        , 200

      m.ack()

    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 5672}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete:false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 1}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]

  it 'test we can consume and interrupt midstream and get all the messages 855', (done)->

    thisproxy = new proxy.route(7003, 5672, "localhost")
    amqp = null


    testData = {test:"message"}
    amqp = null
    queue = uuid()
    messagesRecieved = 0
    consumer = null

    messageProcessor = (m)->
      m.data.should.eql testData
      messagesRecieved++

      if messagesRecieved is 5
        thisproxy.interrupt()

      if messagesRecieved is 10
        done()
      m.ack()


    async.series [
      (next)->
        amqp = new AMQP {host:'localhost', port: 7003}, (e, r)->
          should.not.exist e
          next()

      (next)->
        amqp.queue {queue, autoDelete:false}, (e,q)->
          q.declare ()->
            q.bind "amq.direct", queue, next

      (next)->
        async.forEach [0...10], (i, done)->
          amqp.publish "amq.direct", queue, testData, {confirm: true}, done
        , next

      (next)->
        consumer = amqp.consume queue, {prefetchCount: 1}, messageProcessor, (e,r)->
          should.not.exist e
          next()
    ]

