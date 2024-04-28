import { mapListPlayers, mapMapList, mapServerInfo } from '../../mappers/rcon';
import { getSocket, send } from './socket-manager';
import { parseError } from '@bf2-matchmaking/utils';

export function unpauseRound(address: string) {
  return sendMessage(address, 'bf2cc unpause');
}

export function pauseRound(address: string) {
  return sendMessage(address, 'bf2cc pause');
}

export async function getMapList(address: string) {
  const reply = await sendMessage(address, 'exec maplist.list');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { data: null, error: 'Empty map list response' };
  }
  const data = mapMapList(reply.data);
  if (!data) {
    return { data: null, error: 'Failed to parse map list' };
  }
  return { data, error: null };
}

export async function getPlayerList(address: string) {
  const reply = await sendMessage(address, 'bf2cc pl');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { data: null, error: 'Empty player list response' };
  }
  const data = mapListPlayers(reply.data);
  if (!data) {
    return { data: null, error: 'Failed to parse player list' };
  }
  return { data, error: null };
}

export async function getServerInfo(address: string) {
  const reply = await sendMessage(address, 'bf2cc pl');
  if (reply.error) {
    return reply;
  }
  if (!reply.data) {
    return { data: null, error: 'Empty server info response' };
  }
  const data = mapServerInfo(reply.data);
  if (!data) {
    return { data: null, error: 'Failed to parse server info' };
  }
  return { data, error: null };
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

async function sendMessage(address: string, message: string) {
  try {
    const socket = await getSocket(address);
    const data = await send(socket, message);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: parseError(e) };
  }
}
