import { assertString, postJSON } from '@bf2-matchmaking/utils';
import { Server } from './server/Server';

export function restartWithInfantryMode(server: Server, map?: string) {
  assertString(process.env.HTTP_API_KEY);
  const mapName = map || server.info.currentMapName;
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
  const mapName = map || server.info.currentMapName;
  const serverName = server.info.serverName;
  const apiKey = process.env.HTTP_API_KEY;
  return postJSON(`http://${server.address}:1025/restart_vehicles`, {
    mapName,
    serverName,
    apiKey,
  });
}
