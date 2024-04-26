import { PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';
import { mapListPlayers, mapServerInfo } from '../../mappers/rcon';
import { sendMessage } from './socket-manager';

export function getPlayerList(address: string): Promise<Array<PlayerListItem> | null> {
  return sendMessage(address, 'bf2cc pl').then(mapListPlayers);
}

export function getServerInfo(address: string): Promise<ServerInfo | null> {
  return sendMessage(address, 'bf2cc si').then(mapServerInfo);
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
  return res.trim() === '1';
}
