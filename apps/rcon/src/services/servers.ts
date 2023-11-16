import {
  PlayerListItem,
  LiveInfo,
  ServerRconsRow,
  ServersRow,
  RconBf2Server,
} from '@bf2-matchmaking/types';
import { getPlayerList, getServerInfo, rcon } from '../net/RconManager';
import { externalApi, getJoinmeHref } from '@bf2-matchmaking/utils';
import { getLiveServer } from '../net/ServerManager';
import { client } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';

export async function createLiveInfo({
  id: ip,
  rcon_port,
  rcon_pw,
}: ServerRconsRow): Promise<LiveInfo | null> {
  const info = await rcon(ip, rcon_port, rcon_pw)
    .then(getServerInfo)
    .catch(() => null);
  if (!info) {
    return null;
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [], ip };
  }

  const players: Array<PlayerListItem> = await rcon(ip, rcon_port, rcon_pw)
    .then(getPlayerList)
    .catch(() => []);

  if (players.length !== Number(info.connectedPlayers)) {
    return null;
  }

  return { ...info, players, ip };
}

export async function createRconBF2Server(server: ServersRow): Promise<RconBf2Server> {
  const joinmeHref = await getJoinmeHref(server);
  const { data: location } = await externalApi.ip().getIpLocation(server.ip);
  const country = location?.country || null;
  const city = location?.city || null;
  const live = getLiveServer(server.ip);
  const info = live?.info || null;
  const match = live?.getLiveMatch()?.match || null;
  return { ...server, info, joinmeHref, country, city, match };
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
