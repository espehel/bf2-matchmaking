import { assertObj, assertString, postJSON } from '@bf2-matchmaking/utils';
import { ServerInfo } from '@bf2-matchmaking/types/rcon';
import { getServerInfo } from '@bf2-matchmaking/services/rcon';

export async function restartWithInfantryMode(
  address: string,
  usersxml: string | null,
  mapName?: string,
  serverName?: string
) {
  assertString(process.env.HTTP_API_KEY);
  const { data: info } = await getServerInfo(address);
  assertObj(info, `Connection to ${address} failed`);
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    mapName: getMapName(info, mapName),
    serverName: serverName || info.serverName,
    apiKey,
    usersxml,
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
  const { data: info } = await getServerInfo(address);
  assertObj(info, `Connection to ${address} failed`);
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    mapName: getMapName(info, mapName),
    serverName: serverName || info.serverName,
    apiKey,
    usersxml,
    mode: 'vehicles',
  });
}

function getMapName(info: ServerInfo, map?: string) {
  return (map || info.currentMapName.replace(/_/g, ' '))
    .split(' ')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
