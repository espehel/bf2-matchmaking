import net from 'net';
import { error, info } from '@bf2-matchmaking/logging';
import crypto from 'crypto';

const TIMEOUT = 3000;
const TTL = 10 * 60 * 1000;

export class RconClient {
  socket: net.Socket;
  ip: string;
  port: number;
  password: string;

  constructor(socket: net.Socket, ip: string, port: number, password: string) {
    this.socket = socket;
    this.ip = ip;
    this.port = port;
    this.password = password;
    this.socket.on('timeout', () => {
      this.socket.destroy();
    });
    this.socket.setTimeout(TTL);
  }

  isConnected() {
    return this.socket.readyState === 'open';
  }

  send(message: string) {
    return new Promise<string>((resolve, reject) => {
      info('RconClient', `sending message: ${message}`);

      this.socket.write(message + '\n');

      this.socket.once('data', (response) => {
        this.socket.removeAllListeners('error');
        resolve(response.toString());
      });

      this.socket.once('error', (err) => {
        this.socket.removeAllListeners('data');
        reject(err.message);
      });

      setTimeout(() => {
        reject(`Command ${message} timed out`);
      }, TIMEOUT);
    });
  }

  static login(host: string, port: number, password: string) {
    return new Promise<RconClient>((resolve, reject) => {
      let isAuthenticated = false;
      const socket = net.connect({
        host,
        port,
      });
      info('RconClient', `Initialized ${host}:${port}`);

      socket.on('connect', () => {
        info('RconClient', `Connected to ${host}:${port}`);
      });

      socket.on('data', (data) => {
        const sent = data.toString();
        if (sent.includes('### Digest seed: ')) {
          const seed = sent.replace('### Digest seed: ', '').trim();
          info('RconClient', `Received seed: ${seed} from ${host}:${port}`);
          socket.write(
            'login ' +
              crypto
                .createHash('md5')
                .update(seed + password)
                .digest('hex') +
              '\n'
          );
        }

        if (sent.includes('Authentication successful')) {
          info('RconClient', `Authenticated ${host}:${port}`);
          isAuthenticated = true;
          socket.removeAllListeners();
          resolve(new RconClient(socket, host, port, password));
        }
      });

      socket.on('error', (err) => {
        error('RconClient', err);
        reject(err.message);
      });

      setTimeout(() => {
        if (!isAuthenticated) {
          info('RconClient', `Destroying socket ${host}:${port}`);
          socket.destroy(new Error('Authentication Timeout'));
        }
      }, TIMEOUT);
    });
  }
}
