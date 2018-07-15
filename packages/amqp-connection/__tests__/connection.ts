import assert = require('assert');
import Connection from '../src';

let amqp: Connection;

it('establishes connection', async () => {
  amqp = new Connection({
    hosts: [{
      host: 'localhost',
      port: 5672,
    }],
  });

  await amqp.connect();
});

it('closes connection', async () => {
  await amqp.disconnect();
});
