import { LiveState, ServersRow, ServerInfo, DbServer } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import { getPlayerList, getServerInfo } from '../rcon/bf2-rcon-api';

export async function buildLiveState(address: string): Promise<LiveState> {
  const { data: info, error, readyState } = await getServerInfo(address);
  if (error) {
    throw new Error(`${address}[${readyState}]: ${error.message}`);
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [] };
  }

  const { data: players } = await getPlayerList(address);

  if (!players || players.length !== Number(info.connectedPlayers)) {
    throw new Error(`${address}[${readyState}]: Invalid live state`);
  }

  return { ...info, players };
}
export async function buildLiveStateSafe(address: string): Promise<LiveState | null> {
  try {
    return buildLiveState(address);
  } catch (e) {
    return null;
  }
}

export async function updateServerName(servers: Array<ServersRow>, liveInfo: LiveState) {
  /*const server = servers.find(({ ip }) => ip === liveInfo);
  if (server && server.name !== liveInfo.serverName) {
    info(
      'updateServerName',
      `Server ${server.ip} updating name to ${liveInfo.serverName}`
    );
    await client().updateServer(server.ip, {
      name: liveInfo.serverName,
    });
  }*/
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
