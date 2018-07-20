import assert = require('assert');
import eventToPromise = require('event-to-promise');
import Connection from '../src';
import * as Proxy from './helpers/proxy';

let amqp: Connection;
let proxy: Proxy.Route;

it('establishes connection', async () => {
  amqp = new Connection({
    hosts: [{
      host: 'localhost',
      port: 5672,
    }],
  });

  await amqp.connect();
});

it('we fail connecting to an invalid host', async () => {
  amqp = new Connection({
    hosts: [{ host: 'iamnotthequeueyourlookingfor', port: 5672 }],
    reconnect: false,
  });

  await expect(amqp.connect()).rejects.toThrow('ENOTFOUND');
});

it('we can reconnect if the connection fails 532', async () => {
  proxy = new Proxy.Route(7001, 5672, 'localhost');

  amqp = new Connection({
    heartbeat: 2000,
    hosts: [{ host: 'localhost', port: 7001 }],
  });

  await amqp.connect();

  // interrupt connection
  proxy.interrupt();

  // wait for ready event
  await eventToPromise(amqp, 'ready');
});

it('we can connect to an array of hosts', async () => {
  amqp = new Connection({
    heartbeat: 2000,
    hosts: [{
      host: 'localhost', port: 5672,
    }, {
      host: '127.0.0.1', port: 5672,
    }],
  });

  await amqp.connect();
  await amqp.disconnect();
});

it('we can reconnect to an array of hosts if the connection fails', async () => {
  proxy = new Proxy.Route(9009, 5672, 'localhost');
  amqp = new Connection({
    heartbeat: 2000,
    hosts: [{
      host: 'localhost', port: 9009,
    }, {
      host: '127.0.0.1', port: 9009,
    }],
  });

  await amqp.connect();
  proxy.interrupt();
  await eventToPromise(amqp, 'heartbeat');
});

it('we can timeout connecting to a host', async () => {
  amqp = new Connection({
    hosts: [{ host: 'test.com', port: 5672 }],
    reconnect: false,
    socketOptions: { setTimeout: 100 },
  });

  await expect(amqp.connect()).rejects.toThrow('timeout of 100 exceeded');
});

afterEach(async () => {
  if (amqp) {
    await amqp.disconnect();
  }

  if (proxy) {
    proxy.close();
  }
});
