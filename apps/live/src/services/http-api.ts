import { assertString, postJSON } from '@bf2-matchmaking/utils';
import { Server } from './server/Server';

export function restartWithInfantryMode(server: Server, map?: string) {
  assertString(process.env.HTTP_API_KEY);
  const mapName = getMapName(server, map);
  const serverName = server.info.serverName;
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${server.address}:1025/restart`, {
    mapName,
    serverName,
    apiKey,
  });
}

export function restartWithVehicleMode(server: Server, map?: string) {
  assertString(process.env.HTTP_API_KEY);
  const mapName = getMapName(server, map);
  const serverName = server.info.serverName;
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${server.address}:1025/restart_vehicles`, {
    mapName,
    serverName,
    apiKey,
  });
}

function getMapName(server: Server, map?: string) {
  return (map || server.info.currentMapName.replace(/_/g, ' '))
    .split(' ')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
