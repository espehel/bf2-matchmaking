import { Server } from './Server';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  info,
  logErrorMessage,
  logMessage,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import { PendingServer, ServerRconsRow } from '@bf2-matchmaking/types';
import { Match } from '../match/Match';
import { connectClient, getServerInfo, rcon } from '../rcon/RconManager';

export const SERVER_IDENTIFIED_RATIO = 0.3;

const liveServers = new Map<string, Server>();

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
export async function initLiveServers() {
  const { data, error } = await client().getServerRcons();
  if (error) {
    logSupabaseError('Failed to init live servers', error);
    return;
  }
  await Promise.all(data.map(initLiveServer));

  info('initLiveServers', `Initialized ${liveServers.size}/${data.length} live servers`);
}

export async function initLiveServer(rcon: ServerRconsRow) {
  const liveServer = await Server.create(rcon);
  if (liveServer) {
    liveServers.set(rcon.id, liveServer);
    info('initLiveServer', `Initialized live server ${rcon.id}`);
    return liveServer;
  }
  return null;
}

export function resetLiveMatchServers(liveMatch: Match) {
  for (const server of liveServers.values()) {
    if (server.hasLiveMatch(liveMatch)) {
      server.reset();
    }
  }
}

export function findServer(liveMatch: Match) {
  return Array.from(liveServers.values()).find(isMatchServer(liveMatch));
}

function isMatchServer(liveMatch: Match) {
  const players = liveMatch.match.players;
  return (server: Server) =>
    isServerIdentified(
      players.filter((p) => server.info.players.some((sp) => sp.keyhash === p.keyhash))
        .length,
      players.length
    );
}

export function isServerIdentified(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= SERVER_IDENTIFIED_RATIO;
}

export function createPendingServer() {}

export function connectPendingServer(server: PendingServer) {
  const { port, rcon_port, rcon_pw, address, demo_path } = server;
  connectClient(address, rcon_port, rcon_pw, 5, async () => {
    try {
      const serverInfo = await rcon(address, rcon_port, rcon_pw).then(getServerInfo);

      await client()
        .upsertServer({
          ip: address,
          port,
          name: serverInfo.serverName,
          demos_path: demo_path,
        })
        .then(verifySingleResult);

      const serverRcon = await client()
        .upsertServerRcon({ id: address, rcon_port, rcon_pw })
        .then(verifySingleResult);

      await initLiveServer(serverRcon);
      logMessage(`Server ${address}: Connected pending server`);
    } catch (e) {
      logErrorMessage(`Server ${address}: Failed to connect pending server`, e);
    }
  });
}
