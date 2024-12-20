import net from 'net';
import { error, info, verbose, warn } from '@bf2-matchmaking/logging';
import crypto from 'crypto';
import { assertString } from '@bf2-matchmaking/utils';
import { hash } from '@bf2-matchmaking/redis/hash';
import { DEFAULT_RCON_PORT } from './constants';

const TIMEOUT = 3000;
const TTL = 10 * 60 * 1000;
const sockets = new Map<string, net.Socket>();
export async function createSockets(rcons: Array<[string, string]>) {
  return Promise.all(
    rcons.map(([address, password]) =>
      createSocket(address, password).then((s) => s && address)
    )
  );
}
export async function createSocket(address: string, password: string) {
  return connect(address, password).catch(() => null);
}
async function connect(address: string, password: string) {
  const oldSocket = sockets.get(address);
  if (oldSocket) {
    info('connect', `${address}:${DEFAULT_RCON_PORT} Reconnecting with new socket...`);
    oldSocket.destroy(new Error('Reconnecting with new socket...'));
  }

  const socket = await connectSocket(address, DEFAULT_RCON_PORT, password);

  socket.on('error', (err) => {
    error(`socket`, err);
  });
  socket.on('timeout', () => {
    socket.destroy(new Error(`Socket ${socket.remoteAddress} timeout out...`));
  });
  socket.setTimeout(TTL);

  sockets.set(address, socket);
  return socket;
}

export function disconnect(address: string) {
  const socket = sockets.get(address);
  if (!socket) {
    return false;
  }
  socket.destroy();
  return sockets.delete(address);
}

export async function getSocket(address: string) {
  const socket = sockets.get(address);
  if (socket && socket.readyState === 'open') {
    return socket;
  }
  const rconPW = await hash('cache:rcons').get(address);
  assertString(rconPW, `Rcon ${address} not found in redis`);
  return connect(address, rconPW);
}

export function send(socket: net.Socket, message: string) {
  return new Promise<string>((resolve, reject) => {
    const handleData = (response: Buffer) => {
      socket.removeListener('error', handleError);
      clearTimeout(timeout);
      resolve(response.toString());
    };
    const handleError = (err: Error) => {
      socket.removeListener('data', handleData);
      clearTimeout(timeout);
      reject(err.message);
    };

    socket.once('data', handleData);
    socket.once('error', handleError);

    const timeout = setTimeout(() => {
      socket.removeListener('data', handleData);
      socket.removeListener('error', handleError);
      reject(`Rcon command ${message} timed out for ${socket.remoteAddress}`);
    }, TIMEOUT);
    socket.write(message + '\n');
  });
}

function connectSocket(host: string, port: number, password: string) {
  return new Promise<net.Socket>((resolve, reject) => {
    const socket = net.connect({
      host,
      port,
    });
    verbose('connectSocket', `${host}:${port} Initialized`);

    const timeout = setTimeout(() => {
      socket.destroy();
      reject(`Authentication Timeout ${host}:${port}`);
    }, TIMEOUT);

    socket.on('connect', () => {
      verbose('connectSocket', `${host}:${port} Connected`);
    });

    socket.on('data', (data) => {
      const sent = data.toString();
      if (sent.includes('### Digest seed: ')) {
        const seed = sent.replace('### Digest seed: ', '').trim();
        verbose('connectSocket', `${host}:${port} Received seed "${seed}"`);
        socket.write(
          'login ' +
            crypto
              .createHash('md5')
              .update(seed + password)
              .digest('hex') +
            '\n'
        );
      } else if (sent.includes('Authentication successful')) {
        verbose('connectSocket', `${host}:${port} Authenticated`);
        clearTimeout(timeout);
        socket.removeAllListeners();
        resolve(socket);
      } else if (sent.includes('Authentication failed')) {
        warn('connectSocket', `${host}:${port} Authentication failed`);
        reject('Authentication failed');
      } else {
        verbose('connectSocket', `${host}:${port} Received data "${sent}"`);
      }
    });

    socket.on('error', (err) => {
      error('connectSocket', `${host}:${port} Received error "${err}"`);
      reject(err);
    });

    socket.on('close', (hadError) => {
      clearTimeout(timeout);
      if (hadError) {
        verbose('connectSocket', `${host}:${port} Disconnected with error`);
      } else {
        verbose('connectSocket', `${host}:${port} Disconnected`);
        reject('Connection closed');
      }
    });
  });
}
