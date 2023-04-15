import net from 'net';
import crypto from 'crypto';
import { error, info } from '@bf2-matchmaking/logging';

interface Options {
  host: string;
  port: number;
  password: string;
  timeout?: number | undefined;
}

interface Bf2Client {
  connected: boolean;
  error: unknown;
  send: (message: string) => Promise<string>;
}

export const createClient = ({ host, port, password, timeout = 0 }: Options) => {
  return new Promise<Bf2Client>((resolve, reject) => {
    let connected = false;
    const client = net.connect({
      host,
      port,
      timeout,
    });
    info('client', 'Initialized');

    client.on('connect', () => {
      info('client', 'Connected');
      connected = true;
      client.setTimeout(0);
    });

    client.setTimeout(timeout);
    client.on('timeout', () => {
      error('createClient', `Socket timed out during connection ${host}:${port}`);
      client.end();
      resolve({ ...api, connected, error: 'Connection Timeout' });
    });

    client.once('error', (err) => {
      error('createClient', err);
      resolve({ ...api, connected, error: err });
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
      }

      if (sent.indexOf('Authentication successful') != -1) {
        info('client', 'Authenticated');
        resolve({ ...api, connected, error });
      }
    });

    const api = {
      send: (message: string) =>
        new Promise<string>((resolveSend, reject) => {
          info('client', `sending message: ${message}`);

          client.write(message + '\n');
          client.once('data', (response) => {
            info('client', 'Received response');
            resolveSend(response.toString());
          });
        }),
    };
  });
};
