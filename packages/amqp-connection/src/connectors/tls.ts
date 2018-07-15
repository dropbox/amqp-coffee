import reconnect = require('reconnect-core');
import tls = require('tls');
import { TimeoutError } from '../errors';

export default reconnect(function createConnection(opts: tls.TlsOptions, socketOptions: any = {}) {
  const socket = tls
    .connect(opts)
    .on('secureConnect', function(this: reconnect.InterfaceReconnectableConnection) {
      this.emit('connect');
    })
    .on('data', function(this: reconnect.InterfaceReconnectableConnection, data: Buffer) {
      this.emit('data', data);
    }) as tls.TLSSocket;

  socket.setNoDelay(socketOptions.noDelay);
  socket.setKeepAlive(socketOptions.keepAlive);

  if (socketOptions.setTimeout) {
    socket.setTimeout(socketOptions.setTimeout, () => {
      socket.setTimeout(0);
      // this will cause reconnect
      socket.emit('error', new TimeoutError(`timeout of ${socketOptions.setTimeout} exceeded`));
    });

    socket.once('secureConnect', () => {
      socket.setTimeout(0);
    });
  }

  return socket;
});
