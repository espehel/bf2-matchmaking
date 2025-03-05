import { getPlayerList, getServerInfo } from '@bf2-matchmaking/services/rcon';
import { warn } from '@bf2-matchmaking/logging';
import { createJob, deleteJob } from '@bf2-matchmaking/scheduler';
import { LiveInfo } from '@bf2-matchmaking/types/engine';

async function readServerTask(address: string): Promise<LiveInfo> {
  const { data: serverInfo, error, readyState } = await getServerInfo(address);
  if (error) {
    console.warn('readServerTask', `${address}[${readyState}]: ${error.message}`);
    throw new Error(`${address}[${readyState}]: ${error.message}`);
  }

  const { data: players } =
    serverInfo.connectedPlayers === '0' ? { data: [] } : await getPlayerList(address);

  if (!players || players.length !== Number(serverInfo.connectedPlayers)) {
    warn('readServerTask', `${address}[${readyState}]: Invalid live state`);
    throw new Error(`${address}[${readyState}]: Invalid live state`);
  }
  return { ...serverInfo, players };
}

export function scheduleReadServerJob(address: string) {
  return createJob(`readServer:${address}`, readServerTask).schedule({
    input: address,
    interval: '1s',
  });
}

export function stopReadServerJob(address: string) {
  deleteJob(`readServer:${address}`);
}
