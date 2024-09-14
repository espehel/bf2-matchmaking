import { assertObj, assertString, postJSON } from '@bf2-matchmaking/utils';
import { ServerInfo } from '@bf2-matchmaking/types/rcon';
import { getServerInfo } from '@bf2-matchmaking/services/rcon';

export async function restartWithInfantryMode(address: string, map?: string) {
  assertString(process.env.HTTP_API_KEY);
  const { data: info } = await getServerInfo(address);
  assertObj(info, `Connection to ${address} failed`);
  const mapName = getMapName(info, map);
  const serverName = info.serverName;
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart`, {
    mapName,
    serverName,
    apiKey,
  });
}

export async function restartWithVehicleMode(address: string, map?: string) {
  assertString(process.env.HTTP_API_KEY);
  const { data: info } = await getServerInfo(address);
  assertObj(info, `Connection to ${address} failed`);
  const mapName = getMapName(info, map);
  const serverName = info.serverName;
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${address}:1025/restart_vehicles`, {
    mapName,
    serverName,
    apiKey,
  });
}

function getMapName(info: ServerInfo, map?: string) {
  return (map || info.currentMapName.replace(/_/g, ' '))
    .split(' ')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
