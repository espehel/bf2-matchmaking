import { LiveServer } from './LiveServer';
import { client } from '@bf2-matchmaking/supabase';
import { info, logSupabaseError } from '@bf2-matchmaking/logging';
import { ServerRconsRow } from '@bf2-matchmaking/types';
import { getRconServer } from '../services/servers';
import { LiveMatch } from '../services/LiveMatch';

export const SERVER_IDENTIFIED_RATIO = 0.3;

const liveServers = new Map<string, LiveServer>();
const rcons = new Map<string, ServerRconsRow>();

export async function initLiveServers() {
  const { data, error } = await client().getServerRcons();
  if (error) {
    logSupabaseError('Failed to init live servers', error);
    return;
  }
  await Promise.all(
    data.map(async (rcon) => {
      rcons.set(rcon.id, rcon);
      const rconServer = await getRconServer(rcon);
      if (rconServer) {
        liveServers.set(rcon.id, new LiveServer(rcon, rconServer).start());
      }
    })
  );
  info('initLiveServers', `Initialized ${liveServers.size}/${data.length} live servers`);
}

export function isIdle(serverIp: string) {
  return liveServers.get(serverIp)?.isIdle() || false;
}

export function setServerLiveMatch(serverIp: string, liveMatch: LiveMatch) {
  liveServers.get(serverIp)?.setLiveMatch(liveMatch);
}

export function resetLiveMatchServers(liveMatch: LiveMatch) {
  for (const server of liveServers.values()) {
    if (server.hasLiveMatch(liveMatch)) {
      server.reset();
    }
  }
}

export function findServer(liveMatch: LiveMatch) {
  return Array.from(liveServers.values()).find(isMatchServer(liveMatch));
}

function isMatchServer(liveMatch: LiveMatch) {
  const players = liveMatch.match.players;
  return (server: LiveServer) =>
    isServerIdentified(
      players.filter((p) => server.info.players.some((sp) => sp.keyhash === p.keyhash))
        .length,
      players.length
    );
}

export function isServerIdentified(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= SERVER_IDENTIFIED_RATIO;
}
export function getLiveServers() {
  return Array.from(liveServers.values());
}
