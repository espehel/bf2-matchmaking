import net from 'net';
import { error, info } from '@bf2-matchmaking/logging';

let server: net.Server | null = null;
export const initServer = (port: number): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    if (server) {
      return resolve('Already initialised');
    }
    server = net.createServer((socket) => {
      info(
        'web-admin-socket',
        `Client ${socket.remoteAddress}:${socket.remotePort} connected`
      );

      socket.on('end', () => {
        info(
          'web-admin-socket',
          `Client ${socket.remoteAddress}:${socket.remotePort} disconnected`
        );
      });
      socket.on('data', (chunk) => {
        const data = chunk.toString().split('\t');
        const eventType = data[0];
        info(
          'web-admin-socket',
          `Client ${socket.remoteAddress}:${socket.remotePort} sent event: ${eventType}`
        );
      });
      socket.on('error', (err) => {
        error('web-admin-socket', err);
      });
    });
    server.on('error', (err) => {
      error('web-admin-server', err);
      resolve(JSON.stringify(err));
    });
    server.listen(port, () => {
      info('web-admin-server', `Listening on port ${port}...`);
      resolve('Server Initialized');
    });
  });
