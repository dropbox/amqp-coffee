import reconnect = require('reconnect-core');
import tls = require('tls');
import { TimeoutError } from '../../errors';

export interface ITlsConnectOpts {
  opts: tls.TlsOptions;
  socket?: {
    noDelay?: boolean,
    keepAlive?: boolean,
    setTimeout?: number,
  };
}

export default reconnect<ITlsConnectOpts, tls.TLSSocket>(function createConnection(config: ITlsConnectOpts) {
  const opts = config.opts;
  const socketOptions = config.socket || {};

  const socket = tls.connect(opts)
    .on('secureConnect', function(this: reconnect.Instance<tls.TlsOptions, tls.TLSSocket>) {
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
