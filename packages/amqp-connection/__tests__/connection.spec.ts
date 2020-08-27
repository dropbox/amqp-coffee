import { once } from 'events'
import Connection, { ClusterStatus } from '../src'
import * as Proxy from './helpers/proxy'

let amqp: Connection
let proxy: Proxy.Route

it('establishes connection', async () => {
  expect.assertions(1)

  amqp = new Connection([{ host: 'localhost', port: 5672 }])
  await expect(amqp.connect()).resolves.toBeUndefined()
})

it('we fail connecting to an invalid host', async () => {
  expect.assertions(1)

  amqp = new Connection([{ host: 'iamnotthequeueyourlookingfor', port: 5672 }], {
    reconnect: false,
  })

  await expect(amqp.connect()).rejects.toMatchObject({
    message: 'connection error',
    errors: [{
      code: 'ENOTFOUND',
      errno: 'ENOTFOUND',
      hostname: 'iamnotthequeueyourlookingfor',
      syscall: 'getaddrinfo',
    }]
  })
})

it('we can reconnect if the connection fails 532', async () => {
  expect.assertions(1)

  proxy = new Proxy.Route(7001, 5672, 'localhost')

  amqp = new Connection([{ host: 'localhost', port: 7001 }], {
    heartbeat: 1500,
  })

  await expect(amqp.connect()).resolves.toBeUndefined()

  // interrupt connection
  proxy.interrupt()

  // wait for ready event
  await once(amqp, ClusterStatus.Ready)
})

it('we can connect to an array of hosts', async () => {
  expect.assertions(1)

  amqp = new Connection([{
    host: 'localhost', port: 5672,
  }, {
    host: '127.0.0.1', port: 5672,
  }], {
    heartbeat: 2000,
  })

  await expect(amqp.connect()).resolves.toBeUndefined()
})

it('we can reconnect to an array of hosts if the connection fails', async () => {
  proxy = new Proxy.Route(9009, 5672, 'localhost')
  amqp = new Connection([{
    host: 'localhost', port: 9009,
  }, {
    host: '127.0.0.1', port: 9009,
  }], {
    heartbeat: 2000,
  })

  await expect(amqp.connect()).resolves.toBeUndefined()
  proxy.interrupt()
  await once(amqp, ClusterStatus.Ready)
})


it('we can timeout connecting to a host', async () => {
  amqp = new Connection([{ host: 'test.com', port: 5672 }], {
    reconnect: false,
    socketOptions: { setTimeout: 100 },
  })

  await expect(amqp.connect()).rejects.toMatchObject({
    message: 'connection error',
    errors: [{
      name: 'TimeoutError',
      message: 'timeout of 100 exceeded',
      code: 'ETIMEDOUT',
      errorno: 'ETIMEDOUT',
      syscall: 'connect',
    }]
  })
})

afterEach(async () => {
  if (amqp) {
    await amqp.disconnect()
  }

  if (proxy) {
    proxy.close()
  }
})
