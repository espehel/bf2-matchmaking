import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  getPendingServers,
  initLiveServer,
  removePendingServers,
} from '../services/server/ServerManager';
import { getServerInfo, rcon } from '../services/rcon/RconManager';

export async function updatePendingServers() {
  const pendingServers = getPendingServers();
  if (pendingServers.length === 0) {
    return;
  }
  const connectedServers: Array<string> = [];
  for (const { port, rcon_port, rcon_pw, address } of pendingServers) {
    try {
      const serverInfo = await rcon(address, rcon_port, rcon_pw).then(getServerInfo);

      await client()
        .upsertServer({ ip: address, port, name: serverInfo.serverName })
        .then(verifySingleResult);

      const serverRcon = await client()
        .upsertServerRcon({ id: address, rcon_port, rcon_pw })
        .then(verifySingleResult);

      const liveServer = await initLiveServer(serverRcon);
      if (liveServer) {
        connectedServers.push(address);
      }
    } catch (e) {
      logErrorMessage(`Server ${address}: Failed to update pending server`, e);
    }
  }

  info(
    'updatePendingServers',
    `Connected ${connectedServers.length}/${pendingServers.length} servers`
  );
  removePendingServers(...connectedServers);
}
