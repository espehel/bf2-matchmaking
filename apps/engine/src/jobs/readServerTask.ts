import cron from 'node-cron';
import { getPlayerList, getServerInfo } from '@bf2-matchmaking/services/rcon';
import { topic } from '@bf2-matchmaking/redis/topic';
import { warn } from '@bf2-matchmaking/logging';
import { LiveInfo } from '@bf2-matchmaking/types/engine';

const tasks = new Map<string, cron.ScheduledTask>();

async function readServerTask(address: string) {
  const { data: serverInfo, error, readyState } = await getServerInfo(address);
  if (error) {
    console.warn('readServerTask', `${address}[${readyState}]: ${error.message}`);
    return;
  }

  const { data: players } =
    serverInfo.connectedPlayers === '0' ? { data: [] } : await getPlayerList(address);

  if (!players || players.length !== Number(serverInfo.connectedPlayers)) {
    warn('readServerTask', `${address}[${readyState}]: Invalid live state`);
    return;
  }

  await topic(`server:${address}`).publish<LiveInfo>({ ...serverInfo, players });
}

export function startReadServerTask(address: string) {
  tasks.set(
    address,
    cron.schedule('* * * * * *', () => readServerTask(address))
  );
}
export function removeReadServerTask(address: string) {
  const task = tasks.get(address);
  if (task) {
    task.stop();
    tasks.delete(address);
  }
}
