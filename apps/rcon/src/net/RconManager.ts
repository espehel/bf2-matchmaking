import { RconClient } from './RconClient';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { AddressInfo } from 'net';
import { PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';

interface RconResponse {
  address: AddressInfo;
}
interface RconSuccessResponse<T> extends RconResponse {
  data: T;
  error: null;
}

interface RconError {
  message: string;
}

export interface RconErrorResponse extends RconResponse {
  error: RconError;
  data: null;
}

export type RconResult<T> = RconSuccessResponse<T> | RconErrorResponse;

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
    throw new Error('Empty response');
  }

  return si;
}

export function exec(command: string) {
  return async (client: RconClient) => client.send(command);
}
