import net = require('net');
import reconnect = require('reconnect-core');
import { TimeoutError } from '../errors';

export default reconnect(function createConnection(opts: net.NetConnectOpts, socketOptions: any = {}) {
  const socket = net
    .connect(opts)
    .on('data', function(this: reconnect.InterfaceReconnectableConnection, data: Buffer) {
      this.emit('data', data);
    }) as net.Socket;

  socket.setNoDelay(socketOptions.noDelay);
  socket.setKeepAlive(socketOptions.keepAlive);

  if (socketOptions.setTimeout) {
    socket.setTimeout(socketOptions.setTimeout, () => {
      socket.setTimeout(0);
      socket.emit('error', new TimeoutError(`timeout of ${socketOptions.setTimeout} exceeded`));
    });

    socket.once('connect', () => {
      socket.setTimeout(0);
    });
  }

  return socket;
});
