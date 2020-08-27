import net = require('net');
import reconnect = require('reconnect-core');
import { TimeoutError } from '../../errors'

export interface NetConnectOpts {
  opts: net.NetConnectOpts;
  socket?: {
    noDelay?: boolean,
    keepAlive?: boolean,
    setTimeout?: number,
  };
}

export default reconnect<NetConnectOpts, net.Socket>(function createConnection(config: NetConnectOpts) {
  const socket = net.connect(config.opts)
  const socketOptions = config.socket || {}

  socket.setNoDelay(socketOptions.noDelay)
  socket.setKeepAlive(socketOptions.keepAlive)

  if (socketOptions.setTimeout) {
    socket.setTimeout(socketOptions.setTimeout, () => {
      socket.setTimeout(0)
      socket.emit('error', new TimeoutError(`timeout of ${socketOptions.setTimeout} exceeded`))
      socket.destroy()
    })

    socket.once('connect', () => {
      socket.setTimeout(0)
    })
  }

  return socket
})
