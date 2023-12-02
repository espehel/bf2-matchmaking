import { LiveServer } from './LiveServer';
import { client, fallbackResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logSupabaseError } from '@bf2-matchmaking/logging';
import { PendingServer, ServerRconsRow } from '@bf2-matchmaking/types';
import { createLiveInfo, updateServerName } from '../services/servers';
import { LiveMatch } from '../services/LiveMatch';
import { getServerInfo, rcon } from './RconManager';
import { createLiveMatchFromDns } from '../services/matches';
import { assertObj } from '@bf2-matchmaking/utils';

export const SERVER_IDENTIFIED_RATIO = 0.3;

const liveServers = new Map<string, LiveServer>();
const rcons = new Map<string, ServerRconsRow>();
let pendingServers: Array<PendingServer> = [];

export function getServerRcon(ip: string) {
  const rconInfo = rcons.get(ip);
  assertObj(rconInfo, `No rcon for ${ip}`);
  return rcon(rconInfo.id, rconInfo.rcon_port, rconInfo.rcon_pw);
}
export function getLiveServers() {
  return Array.from(liveServers.values());
}

export function getLiveServer(ip: string) {
  return liveServers.get(ip) || null;
}

export function removeLiveServer(ip: string) {
  const liveServer = liveServers.get(ip);
  if (liveServer) {
    liveServer.reset();
    liveServers.delete(ip);
    return liveServer;
  }
  return null;
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
    const liveServer = new LiveServer(rcon, liveInfo);
    liveServers.set(rcon.id, liveServer);
    info('initLiveServer', `Initialized live server ${rcon.id}`);
    return liveServer;
  }
  return null;
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

export function addPendingServer(server: PendingServer) {
  pendingServers = pendingServers
    .filter(({ dns }) => server.dns.name === dns.name)
    .concat(server);
}

export async function updatePendingServers() {
  if (pendingServers.length === 0) {
    return;
  }
  const connectedServers: Array<string> = [];
  for (const { dns, port, rcon_port, rcon_pw } of pendingServers) {
    const serverInfo = await rcon(dns.name, rcon_port, rcon_pw).then(getServerInfo);
    if (!serverInfo) {
      info('updatePendingServers', `Server ${dns.name}: Failed to get info`);
      continue;
    }
    try {
      const server = await client()
        .upsertServer({ ip: dns.name, port, name: serverInfo.serverName })
        .then(verifySingleResult);

      const serverRcon = await client()
        .upsertServerRcon({ id: dns.name, rcon_port, rcon_pw })
        .then(verifySingleResult);

      const liveServer = await initLiveServer(serverRcon);
      await createLiveMatchFromDns(dns, server);
      if (liveServer) {
        connectedServers.push(dns.name);
      }
    } catch (e) {
      logErrorMessage(`Server ${dns.name}: Failed to update pending server`, e);
    }
  }

  info(
    'updatePendingServers',
    `Connected ${connectedServers.length}/${pendingServers.length} servers`
  );
  pendingServers = pendingServers.filter(
    ({ dns }) => !connectedServers.includes(dns.name)
  );
}

export async function updateIdleLiveServers() {
  const idleServers = Array.from(liveServers.values()).filter((s) => s.isIdle());
  if (idleServers.length === 0) {
    info('updateIdleLiveServers', 'No idle live servers found');
    return;
  }

  const numberOfUpdated = await updateServers(idleServers, (liveServer) => {
    info(
      'updateIdleLiveServers',
      `Server ${liveServer.ip} is unresponsive, removing from live servers`
    );
    liveServer.reset();
    liveServers.delete(liveServer.ip);
  });

  info(
    'updateIdleLiveServers',
    `Updated ${numberOfUpdated}/${idleServers.length} idle servers`
  );
}

export async function updateActiveLiveServers() {
  const activeServers = Array.from(liveServers.values()).filter((s) => !s.isIdle());
  if (activeServers.length === 0) {
    return;
  }

  await updateServers(activeServers, (liveServer) => {
    info(
      'updateActiveLiveServers',
      `Server ${liveServer.ip} is unresponsive, resetting live server`
    );
    liveServer.reset();
  });
}

async function updateServers(
  servers: Array<LiveServer>,
  onUnresponsive: (liveServer: LiveServer) => void
) {
  const updatedServers = await Promise.all(
    servers.map((liveServer) => liveServer.update())
  );

  const serversWithError = updatedServers.filter((updatedServer) =>
    Boolean(updatedServer.errorAt)
  );

  serversWithError.filter(isUnresponsive).forEach(onUnresponsive);

  return updatedServers.length - serversWithError.length;
}

function isUnresponsive(liveServer: LiveServer) {
  return liveServer.updatedAt.diffNow('minutes').minutes < -60;
}
