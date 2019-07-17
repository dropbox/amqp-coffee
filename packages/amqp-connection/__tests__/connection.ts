import e2p = require('event-to-promise');
import Connection from '../src';
import * as Proxy from './helpers/proxy';

let amqp: Connection;
let proxy: Proxy.Route;

it('establishes connection', async () => {
  expect.assertions(1);

  amqp = new Connection([{ host: 'localhost', port: 5672 }]);
  await expect(amqp.connect()).resolves.toBeUndefined();
});

it('we fail connecting to an invalid host', async () => {
  expect.assertions(1);

  amqp = new Connection([{ host: 'iamnotthequeueyourlookingfor', port: 5672 }], {
    reconnect: false,
  });

  await expect(amqp.connect()).rejects.toMatchObject({
    internalErrors: {
      iamnotthequeueyourlookingfor_5672: {
        message: 'getaddrinfo ENOTFOUND iamnotthequeueyourlookingfor iamnotthequeueyourlookingfor:5672',
      },
    },
    message: 'cluster drained',
  });
});

it('we can reconnect if the connection fails 532', async () => {
  expect.assertions(1);

  proxy = new Proxy.Route(7001, 5672, 'localhost');

  amqp = new Connection([{ host: 'localhost', port: 7001 }], {
    heartbeat: 2000,
  });

  await expect(amqp.connect()).resolves.toBeUndefined();

  // interrupt connection
  proxy.interrupt();

  // wait for ready event
  await e2p(amqp, 'connect');
});

// it('we can connect to an array of hosts', async () => {
//   amqp = new Connection([{
//     host: 'localhost', port: 5672,
//   }, {
//     host: '127.0.0.1', port: 5672,
//   }], {
//     heartbeat: 2000,
//   });
//
//   await expect(amqp.connect()).resolves;
//   await expect(amqp.disconnect()).resolves;
// });
//
// it('we can reconnect to an array of hosts if the connection fails', async () => {
//   proxy = new Proxy.Route(9009, 5672, 'localhost');
//   amqp = new Connection([{
//     host: 'localhost', port: 9009,
//   }, {
//     host: '127.0.0.1', port: 9009,
//   }], {
//     heartbeat: 2000,
//   });
//
//   await expect(amqp.connect()).resolves;
//   proxy.interrupt();
//   await e2p(amqp, 'ready');
// });
//
// it('we can timeout connecting to a host', async () => {
//   amqp = new Connection([{ host: 'test.com', port: 5672 }], {
//     reconnect: false,
//     socketOptions: { setTimeout: 100 },
//   });
//
//   await expect(amqp.connect()).rejects.toThrow('timeout of 100 exceeded');
// });

afterEach(async () => {
  if (amqp) {
    await amqp.disconnect();
  }

  if (proxy) {
    proxy.close();
  }
});
