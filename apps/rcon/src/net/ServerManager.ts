import { LiveServer } from './LiveServer';
import { client, fallbackResult, verifyResult } from '@bf2-matchmaking/supabase';
import { info, logSupabaseError } from '@bf2-matchmaking/logging';
import { ServerRconsRow } from '@bf2-matchmaking/types';
import { createLiveInfo, updateServerName } from '../services/servers';
import { LiveMatch } from '../services/LiveMatch';
import { verify } from '@bf2-matchmaking/utils';

export const SERVER_IDENTIFIED_RATIO = 0.3;

const liveServers = new Map<string, LiveServer>();
const rcons = new Map<string, ServerRconsRow>();

export function getLiveServers() {
  return Array.from(liveServers.values());
}

export function getLiveServer(ip: string) {
  return liveServers.get(ip) || null;
}

export function isOffline(host: string) {
  return !liveServers.has(host) && rcons.has(host);
}

export function getLiveInfo(ip: string) {
  return liveServers.get(ip)?.info || null;
}
export async function initLiveServers() {
  const servers = await client().getServers().then(fallbackResult([]));
  const { data, error } = await client().getServerRcons();
  if (error) {
    logSupabaseError('Failed to init live servers', error);
    return;
  }
  await Promise.all(
    data.map(async (rcon) => {
      rcons.set(rcon.id, rcon);
      const liveInfo = await createLiveInfo(rcon);
      if (liveInfo) {
        liveServers.set(rcon.id, new LiveServer(rcon, liveInfo));
        await updateServerName(servers || [], liveInfo);
      }
    })
  );
  info('initLiveServers', `Initialized ${liveServers.size}/${data.length} live servers`);
}

export async function initLiveServer(rcon: ServerRconsRow) {
  rcons.set(rcon.id, rcon);
  const liveInfo = await createLiveInfo(rcon);
  if (liveInfo) {
    liveServers.set(rcon.id, new LiveServer(rcon, liveInfo));
    info('initLiveServer', `Initialized live server ${rcon.id}`);
  }
}

export function reconnectLiveServer(host: string) {
  const rcon = rcons.get(host);
  if (rcon) {
    return initLiveServer(rcon);
  }
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

export async function updateIdleLiveServers() {
  const idleServers = Array.from(liveServers.values()).filter((s) => s.isIdle());
  if (idleServers.length === 0) {
    info('updateIdleLiveServers', 'No idle live servers found');
    return;
  }
  const serverInfoList = await Promise.all(
    idleServers.map((liveServer) => liveServer.update())
  );
  info(
    'updateIdleLiveServers',
    `Updated ${serverInfoList.length}/${idleServers.length} idle servers`
  );
}

export async function updateActiveLiveServers() {
  const activeServers = Array.from(liveServers.values()).filter((s) => !s.isIdle());
  if (activeServers.length === 0) {
    return;
  }
  const serverInfoList = await Promise.all(
    activeServers.map((liveServer) => liveServer.update())
  );
  info(
    'updateActiveLiveServers',
    `Updated ${serverInfoList.length}/${activeServers.length} active servers`
  );
}
