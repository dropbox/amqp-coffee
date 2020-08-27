import reconnect = require('reconnect-core');
import tls = require('tls');
import { TimeoutError } from '../../errors'

export interface TlsConnectOpts {
  opts: tls.ConnectionOptions;
  socket?: {
    noDelay?: boolean,
    keepAlive?: boolean,
    setTimeout?: number,
  };
}

export default reconnect<TlsConnectOpts, tls.TLSSocket>(function createConnection(config: TlsConnectOpts) {
  const opts = config.opts
  const socketOptions = config.socket || {}

  const socket = tls.connect(opts).on('secureConnect', () => {
    this.emit('connect')
  })

  socket.setNoDelay(socketOptions.noDelay)
  socket.setKeepAlive(socketOptions.keepAlive)

  if (socketOptions.setTimeout) {
    socket.setTimeout(socketOptions.setTimeout, () => {
      socket.setTimeout(0)
      socket.emit('error', new TimeoutError(`timeout of ${socketOptions.setTimeout} exceeded`))
      socket.destroy()
    })

    socket.once('secureConnect', () => {
      socket.setTimeout(0)
    })
  }

  return socket
})
