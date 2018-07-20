import reconnect = require('reconnect-core');
import tls = require('tls');
import { TimeoutError } from '../errors';

export default reconnect(function createConnection(opts: tls.TlsOptions, socketOptions: any = {}) {
  const socket = tls.connect(opts)
    .on('secureConnect', function(this: reconnect.IReconnectableConnection) {
      this.emit('connect');
    });

  socket.setNoDelay(socketOptions.noDelay);
  socket.setKeepAlive(socketOptions.keepAlive);

  if (socketOptions.setTimeout) {
    socket.setTimeout(socketOptions.setTimeout, () => {
      socket.setTimeout(0);
      socket.emit('error', new TimeoutError(`timeout of ${socketOptions.setTimeout} exceeded`));
      socket.destroy();
    });

    socket.once('secureConnect', () => {
      socket.setTimeout(0);
    });
  }

  return socket;
});
