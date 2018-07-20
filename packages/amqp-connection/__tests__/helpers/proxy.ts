import _debug from 'debug';
import net = require('net');

const debug = _debug('proxy');

export class Route {
  private proxyPort: number;
  private operational: boolean;
  private serviceSockets: any[];
  private proxySockets: any[];
  private server: net.Server;

  constructor(proxyPort: number, servicePort: number = 5672, serviceHost: string = '127.0.0.1') {
    this.proxyPort = proxyPort || 9001;

    this.operational = true;
    this.serviceSockets = [];
    this.proxySockets = [];

    this.server = net.createServer((proxySocket) => {
      // If we're "experiencing trouble", immediately end the connection.
      if (!this.operational) {
        proxySocket.end();
        return;
      }

      // If we're operating normally, accept the connection and begin proxying traffic.
      this.proxySockets.push(proxySocket);

      let connected = false;
      let buffers: Buffer[] = [];
      const serviceSocket = new net.Socket();
      this.serviceSockets.push(serviceSocket);
      serviceSocket.connect(servicePort, serviceHost);
      serviceSocket.on('connect', () => {
        connected = true;
        for (const buf of buffers) {
          serviceSocket.write(buf);
        }
        buffers = [];
      });
      proxySocket.on('error', () => {
        serviceSocket.end();
      });
      serviceSocket.on('error', () => {
        debug('Could not connect to service at host ' + serviceHost + ', port ' + servicePort);
        proxySocket.end();
      });
      proxySocket.on('data', (data) => {
        if (this.operational) {
          if (connected) {
            serviceSocket.write(data);
          } else {
            buffers.push(data);
          }
        }
      });
      serviceSocket.on('data', (data) => {
        if (this.operational) {
          proxySocket.write(data);
        }
      });
      proxySocket.on('close', () => {
        serviceSocket.end();
      });
      serviceSocket.on('close', () => {
        proxySocket.end();
      });
    });

    this.listen();
  }

  public listen() {
    debug('listening for proxy connection...');
    this.operational = true;
    this.server.listen(this.proxyPort);
  }

  public close() {
    debug('closing proxy connection...');
    this.operational = false;
    for (const socket of this.serviceSockets) {
      socket.destroy();
    }
    this.serviceSockets = [];
    for (const socket of this.proxySockets) {
      socket.destroy();
    }
    this.proxySockets = [];
    this.server.close();
  }

  public interrupt(howLong?: number) {
    debug('interrupting proxy connection...');
    this.close();
    setTimeout(() => this.listen(), howLong || 50);
  }
}

if (!module.parent) {
  const proxyPort = parseInt(process.argv[2], 10);
  const servicePort = parseInt(process.argv[3], 10) || undefined;
  const serviceHost = process.argv[4];
  const proxyRoute = new Route(proxyPort, servicePort, serviceHost);

  // Don't exit until parent kills us.
  setInterval(() => {
    if (process.argv[5]) {
      proxyRoute.interrupt();
    }
  }, parseInt(process.argv[5], 10) || 1000);
}
