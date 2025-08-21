import { assertObj, assertString, postJSON } from '@bf2-matchmaking/utils';
import { ServerInfo } from '@bf2-matchmaking/types/rcon';
import { getServerLiveInfo, getServerDataSafe } from '@bf2-matchmaking/redis/servers';
import { RestartBF2ServerData } from '@bf2-matchmaking/types/server';

export async function restartWithInfantryMode(
  address: string,
  usersxml: string | null,
  mapName?: string,
  serverName?: string
) {
  assertString(process.env.HTTP_API_KEY);
  const data = await getServerDataSafe(address);
  const info = await getServerLiveInfo(address);
  assertObj(data, `Failed to get ${address} data from redis`);
  assertObj(info, `Failed to get ${address} info from redis`);
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    mapName: getMapName(info, mapName),
    serverName: serverName || data.name,
    apiKey,
    usersxml,
    profilexml: null,
    mode: 'infantry',
  });
}

export async function restartWithVehicleMode(
  address: string,
  usersxml: string | null,
  mapName?: string,
  serverName?: string
) {
  assertString(process.env.HTTP_API_KEY);
  const data = await getServerDataSafe(address);
  const info = await getServerLiveInfo(address);
  assertObj(data, `Failed to get ${address} data from redis`);
  assertObj(info, `Failed to get ${address} info from redis`);
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    mapName: getMapName(info, mapName),
    serverName: serverName || data.name,
    apiKey,
    usersxml,
    profilexml: null,
    mode: 'vehicles',
  });
}

export async function restartWithProfile(
  address: string,
  data: RestartBF2ServerData,
  usersxml: string | null
) {
  assertString(process.env.HTTP_API_KEY);
  const info = await getServerLiveInfo(address);
  assertObj(info, `Failed to get ${address} info from redis`);
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    apiKey,
    usersxml,
    ...data,
  });
}

function getMapName(info: ServerInfo, map?: string) {
  return (map || info.currentMapName.replace(/_/g, ' '))
    .split(' ')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
