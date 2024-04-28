import {
  PlayerListItem,
  LiveInfo,
  ServerRconsRow,
  ServersRow,
  LiveServer,
  ServerInfo,
  DbServer,
} from '@bf2-matchmaking/types';
import {
  getPlayerList as getPlayerListOrThrow,
  getServerInfo as getServerInfoOrThrow,
  hasNoVehicles,
  rcon,
} from '../rcon/RconManager';
import { api, externalApi, getJoinmeDirect, getJoinmeHref } from '@bf2-matchmaking/utils';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import { Server } from './Server';
import { getPlayerList, getServerInfo } from '../rcon/bf2-rcon-api';

export async function createLiveInfo({
  id: ip,
  rcon_port,
  rcon_pw,
}: ServerRconsRow): Promise<LiveInfo | null> {
  const info = await rcon(ip, rcon_port, rcon_pw)
    .then(getServerInfoOrThrow)
    .catch(() => null);
  if (!info) {
    return null;
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [], ip };
  }

  const players: Array<PlayerListItem> = await rcon(ip, rcon_port, rcon_pw)
    .then(getPlayerListOrThrow)
    .catch(() => []);

  if (players.length !== Number(info.connectedPlayers)) {
    return null;
  }

  return { ...info, players, ip };
}

export async function buildLiveInfo(address: string): Promise<LiveInfo | null> {
  const { data: info } = await getServerInfo(address);
  if (!info) {
    return null;
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [], ip: address };
  }

  const { data: players } = await getPlayerList(address);

  if (!players || players.length !== Number(info.connectedPlayers)) {
    return null;
  }

  return { ...info, players, ip: address };
}

export async function toLiveServer(server: Server): Promise<LiveServer> {
  const { address, gamePort, info, updatedAt, errorAt } = server;
  const joinmeHref = await getJoinmeHref(server.address, server.gamePort);
  const joinmeDirect = await getJoinmeDirect(server.address, server.gamePort);
  const { data: location } = await externalApi.ip().getIpLocation(server.address);
  const noVehicles = await server.rcon().then(hasNoVehicles);
  const country = location?.country || null;
  const city = location?.city || null;

  return {
    status: 'idle',
    address,
    port: Number(gamePort),
    info,
    noVehicles,
    updatedAt: updatedAt.toISO(),
    errorAt: errorAt?.toISO() || null,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    matchId: server.getLiveMatch()?.match.id || null,
  };
}

export async function updateServerName(servers: Array<ServersRow>, liveInfo: LiveInfo) {
  const server = servers.find(({ ip }) => ip === liveInfo.ip);
  if (server && server.name !== liveInfo.serverName) {
    info(
      'updateServerName',
      `Server ${server.ip} updating name to ${liveInfo.serverName}`
    );
    await client().updateServer(server.ip, {
      name: liveInfo.serverName,
    });
  }
}

export async function getAddress(ip: string) {
  const { data: dns } = await api.platform().getServerDns(ip);
  return dns?.name || ip;
}

export async function upsertServer(
  address: string,
  port: string,
  rcon_port: number,
  rcon_pw: string,
  serverInfo: ServerInfo,
  demo_path?: string
): Promise<DbServer> {
  const server = await client()
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

  info('routes/servers', `Upserted server ${address} with name ${serverInfo.serverName}`);
  return { ...server, rcon: serverRcon };
}
