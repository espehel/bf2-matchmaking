import { RconClient } from './RconClient';
import { mapListPlayers, mapServerInfo } from '../../mappers/rcon';
import { AsyncResult, PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
import { logErrorMessage, logWarnMessage } from '@bf2-matchmaking/logging';

const clients = new Map<string, RconClient>();
export async function rcon(ip: string, port: number, password: string) {
  const existingClient = clients.get(ip);
  if (existingClient && existingClient.isConnected()) {
    return existingClient;
  }
  const newClient = await RconClient.login(ip, port, password);
  clients.set(ip, newClient);
  return newClient;
}

export function connectClient(
  ip: string,
  port: number,
  password: string,
  retries: number,
  cb: VoidFunction
) {
  connect(retries).then((client) => {
    if (client) {
      cb();
    } else {
      logWarnMessage(`Rcon ${ip}:${port}: Failed to connect after ${retries} retries.`);
    }
  });
  async function connect(retries: number = 5) {
    const client = await rcon(ip, port, password).catch(() => null);
    if (!client && retries > 0) {
      await wait(1);
      return connect(retries - 1);
    }
    return client;
  }
}

export async function getPlayerList(client: RconClient): Promise<Array<PlayerListItem>> {
  const pl = await exec('bf2cc pl')(client).then(mapListPlayers);
  if (!pl) {
    throw new Error('Empty response');
  }

  return pl;
}

export async function getServerInfo(client: RconClient): Promise<ServerInfo> {
  const si = await exec('bf2cc si')(client).then(mapServerInfo);
  if (!si) {
    throw new Error('Empty ServerInfo response');
  }
  return si;
}

export function switchPlayers(players: Array<string>) {
  return async (client: RconClient) => {
    const resultArray = [];
    for (const playerId of players) {
      const result = await client.send(`bf2cc switchplayer ${playerId} 3`);
      resultArray.push(result);
    }
    return resultArray;
  };
}

export function restartRound(client: RconClient) {
  return client.send('admin.restartMap');
}

export function restartServer(client: RconClient) {
  return client.send('quit');
}

export function exec(command: string) {
  return (client: RconClient) => client.send(command);
}

export async function hasNoVehicles(client: RconClient) {
  const res = await client.send('exec sv.noVehicles');
  return res.trim() === '1';
}
