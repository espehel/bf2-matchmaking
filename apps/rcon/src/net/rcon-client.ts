import net from 'net';
import crypto from 'crypto';
import { error, info } from '@bf2-matchmaking/logging';

interface Options {
  host: string;
  port: number;
  password: string;
  timeout?: number | undefined;
}

interface RconClient {
  connected: boolean;
  error: string | null;
  send: (message: string) => Promise<string>;
  listen: (cmd: string, cb: (response: string) => void) => void;
}
const TIMEOUT = 3000;
export const createClient = ({ host, port, password, timeout = TIMEOUT }: Options) => {
  return new Promise<RconClient>((resolve) => {
    let connected = false;
    const client = net.connect({
      host,
      port,
      timeout,
    });
    info('client', `Initialized ${host}:${port};${password}`);

    client.on('connect', () => {
      info('client', 'Connected');
      client.setTimeout(0);
    });

    client.setTimeout(timeout);
    client.on('timeout', () => {
      error('createClient', `Socket timed out during connection ${host}:${port}`);
      client.destroy();
      resolve({ ...api, connected, error: 'Connection Timeout' });
    });

    client.once('error', (err) => {
      error('createClient', err);
      resolve({ ...api, connected, error: err.message });
    });

    client.on('data', (data) => {
      const sent = data.toString();
      if (sent.indexOf('### Digest seed: ') != -1) {
        const seed = sent.replace('### Digest seed: ', '').trim();
        info('client', `seed: ${seed}`);
        client.write(
          'login ' +
            crypto
              .createHash('md5')
              .update(seed + password)
              .digest('hex') +
            '\n'
        );

        setTimeout(() => {
          if (!connected) {
            error(
              'createClient',
              `Socket timed out during authentication ${host}:${port}`
            );
            client.destroy();
            resolve({ ...api, connected, error: 'Authentication Timeout' });
          }
        }, TIMEOUT);
      }

      if (sent.indexOf('Authentication successful') != -1) {
        info('client', 'Authenticated');
        connected = true;
        resolve({ ...api, connected, error: null });
      }
    });

    const api = {
      send: (message: string) =>
        new Promise<string>((resolveSend, reject) => {
          info('client', `sending message: ${message}`);

          client.write(message + '\n');
          client.once('data', (response) => {
            resolveSend(response.toString());
          });
          setTimeout(() => {
            reject(`Command ${message} timed out`);
          }, TIMEOUT);
        }),
      listen: (cmd: string, cb: (response: string) => void) => {
        info('client', `Start listening with command: ${cmd}`);

        client.write(cmd + '\n');
        client.on('data', (response) => {
          info('client', 'Received response while listening');
          cb(response.toString());
        });
      },
    };
  });
};
