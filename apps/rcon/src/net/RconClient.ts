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
    this.socket.on('error', (err) => {
      error(`RconClient(${this.ip})`, err);
    });
    this.socket.on('timeout', () => {
      this.socket.destroy(new Error(`Socket ${this.ip} timeout out...`));
    });
    this.socket.setTimeout(TTL);
  }

  isConnected() {
    return this.socket.readyState === 'open';
  }

  send(message: string) {
    return new Promise<string>((resolve, reject) => {
      const handleData = (response: Buffer) => {
        this.socket.removeListener('data', handleData);
        clearTimeout(timeout);
        resolve(response.toString());
      };
      const handleError = (err: Error) => {
        this.socket.removeListener('data', handleData);
        clearTimeout(timeout);
        reject(err.message);
      };

      this.socket.once('data', handleData);
      this.socket.once('error', handleError);

      const timeout = setTimeout(() => {
        this.socket.removeListener('data', handleData);
        this.socket.removeListener('error', handleError);
        reject(`Rcon command ${message} timed out for ${this.ip}`);
      }, TIMEOUT);

      this.socket.write(message + '\n');
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
        } else if (sent.includes('Authentication successful')) {
          info('RconClient', `Authenticated ${host}:${port}`);
          isAuthenticated = true;
          socket.removeAllListeners();
          resolve(new RconClient(socket, host, port, password));
        } else {
          info('RconClient', `Received: ${sent} from ${host}:${port}`);
        }
      });

      socket.on('error', (err) => {
        error('RconClient', err);
      });

      socket.on('close', (hadError) => {
        info('RconClient', `Disconnected from ${host}:${port}, hadError: ${hadError}`);
      });

      setTimeout(() => {
        if (!isAuthenticated) {
          const errMsg = `Authentication Timeout ${host}:${port}`;
          socket.destroy(new Error(errMsg));
          reject(errMsg);
        }
      }, TIMEOUT);
    });
  }
}
