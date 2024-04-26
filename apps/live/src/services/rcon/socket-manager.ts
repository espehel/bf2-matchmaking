import net from 'net';
import { error, info, verbose, warn } from '@bf2-matchmaking/logging';
import crypto from 'crypto';
import { getRcon } from '@bf2-matchmaking/redis';
import { assertObj } from '@bf2-matchmaking/utils';
import { ServerRconsRow } from '@bf2-matchmaking/types';

const TIMEOUT = 3000;
const TTL = 10 * 60 * 1000;
const sockets = new Map<string, net.Socket>();
export async function connectSockets(rcons: Array<ServerRconsRow>) {
  return Promise.all(
    rcons.map((rcon) =>
      connect(rcon)
        .then(() => rcon.id)
        .catch(() => null)
    )
  );
}
async function connect(rcon: ServerRconsRow) {
  const oldSocket = sockets.get(rcon.id);
  if (oldSocket) {
    info('connect', `${rcon.id}:${rcon.rcon_port} Reconnecting with new socket...`);
    oldSocket.destroy(new Error('Reconnecting with new socket...'));
  }

  const socket = await connectSocket(rcon.id, rcon.rcon_port, rcon.rcon_pw);

  socket.on('error', (err) => {
    error(`socket`, err);
  });
  socket.on('timeout', () => {
    socket.destroy(new Error(`Socket ${socket.remoteAddress} timeout out...`));
  });
  socket.setTimeout(TTL);

  sockets.set(rcon.id, socket);
  return socket;
}

export async function sendMessage(address: string, message: string) {
  const socket = await getSocket(address);
  return send(socket, message);
}

async function getSocket(address: string) {
  const socket = sockets.get(address);
  if (socket && socket.readyState === 'open') {
    return socket;
  }
  const rcon = await getRcon(address);
  assertObj(rcon, `Rcon ${address} not found`);
  return connect(rcon);
}

function send(socket: net.Socket, message: string) {
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
      } else {
        verbose('connectSocket', `${host}:${port} Received data "${sent}"`);
      }
    });

    socket.on('error', (err) => {
      verbose('connectSocket', `${host}:${port} Received error "${err}"`);
      reject(err);
    });

    socket.on('close', (hadError) => {
      clearTimeout(timeout);
      if (hadError) {
        verbose('connectSocket', `${host}:${port} Disconnected with error`);
      } else {
        verbose('connectSocket', `${host}:${port} Disconnected`);
      }
    });
  });
}
