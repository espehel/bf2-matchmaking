import { mapListPlayers, mapMapList, mapServerInfo } from '../../mappers/rcon';
import { getSocket, send } from './socket-manager';
import { toFetchError } from '@bf2-matchmaking/utils';
import { RconResult } from '@bf2-matchmaking/types/src/rcon';
import { PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';

export function unpauseRound(address: string) {
  return sendMessage(address, 'bf2cc unpause');
}

export function pauseRound(address: string) {
  return sendMessage(address, 'bf2cc pause');
}

export async function getMapList(address: string): Promise<RconResult<string[]>> {
  const reply = await sendMessage(address, 'exec maplist.list');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { ...reply, data: null, error: { message: 'Empty map list response' } };
  }
  const data = mapMapList(reply.data);
  if (!data) {
    return { ...reply, data: null, error: { message: 'Failed to parse map list' } };
  }
  return { ...reply, data };
}

export async function getPlayerList(
  address: string
): Promise<RconResult<PlayerListItem[]>> {
  const reply = await sendMessage(address, 'bf2cc pl');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { ...reply, data: null, error: { message: 'Empty player list response' } };
  }
  const data = mapListPlayers(reply.data);
  if (!data) {
    return { ...reply, data: null, error: { message: 'Failed to parse player list' } };
  }
  return { ...reply, data };
}

export async function getServerInfo(address: string): Promise<RconResult<ServerInfo>> {
  const reply = await sendMessage(address, 'bf2cc si');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { ...reply, data: null, error: { message: 'Empty server info response' } };
  }
  const data = mapServerInfo(reply.data);
  if (!data) {
    return { ...reply, data: null, error: { message: 'Failed to parse server info' } };
  }
  return { ...reply, data };
}

export async function switchPlayers(address: string, players: Array<string>) {
  const resultArray = [];
  for (const playerId of players) {
    const result = await sendMessage(address, `bf2cc switchplayer ${playerId} 3`);
    resultArray.push(result);
  }
  return resultArray;
}

export function restartRound(address: string) {
  return sendMessage(address, 'admin.restartMap');
}

export function restartServer(address: string) {
  return sendMessage(address, 'quit');
}

export function exec(address: string, command: string) {
  return sendMessage(address, `exec ${command}`);
}

export async function hasNoVehicles(address: string) {
  const res = await exec(address, 'sv.noVehicles');
  if (res.error) {
    return res;
  }
  return { data: res.data?.trim() === '1', error: null };
}

async function sendMessage(address: string, message: string): Promise<RconResult> {
  let readyState = 'missing';
  try {
    const socket = await getSocket(address);
    readyState = socket.readyState;
    const data = await send(socket, message);
    readyState = socket.readyState;
    return { data, error: null, readyState };
  } catch (e) {
    return { data: null, error: toFetchError(e), readyState };
  }
}
