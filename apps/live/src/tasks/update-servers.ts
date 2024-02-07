import { getLiveServers, removeLiveServer } from '../services/server/ServerManager';
import { info } from '@bf2-matchmaking/logging';
import { Server } from '../services/server/Server';

export async function updateServers() {
  const staleServers = getLiveServers().filter((server) => server.isStale());
  if (staleServers.length === 0) {
    info('updateServers', 'No stale servers found');
    return;
  }

  for (const server of staleServers) {
    await server.update();
  }

  const serversWithError = staleServers.filter((updatedServer) =>
    Boolean(updatedServer.errorAt)
  );

  serversWithError.filter(isUnresponsive).forEach(handleUnresponsive);

  const numberOfUpdated = staleServers.length - serversWithError.length;

  info(
    'updateServers',
    `Updated ${numberOfUpdated}/${staleServers.length} stale servers`
  );
}

function isUnresponsive(liveServer: Server) {
  return liveServer.updatedAt.diffNow('minutes').minutes < -60;
}

function handleUnresponsive(server: Server) {
  if (server.isIdle()) {
    info(
      'handleUnresponsive',
      `Server ${server.address} is unresponsive, removing from live servers`
    );
    removeLiveServer(server.address);
  } else {
    info(
      'handleUnresponsive',
      `Server ${server.address} is unresponsive, resetting live server`
    );
    server.reset();
  }
}
