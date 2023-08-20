import { RconClient } from './RconClient';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { PlayerListItem, PollServerStatus, ServerInfo } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import moment, { Moment } from 'moment';
import { formatSecToMin } from '@bf2-matchmaking/utils';

const clients = new Map<string, RconClient>();
const POLL_INTERVAL = 1000 * 10;
const POLL_MAX_DURATION = 1000 * 3600 * 3;
export async function rcon(ip: string, port: number, password: string) {
  const existingClient = clients.get(ip);
  if (existingClient && existingClient.isConnected()) {
    return existingClient;
  }
  const newClient = await RconClient.login(ip, port, password);
  clients.set(ip, newClient);
  return newClient;
}

export async function getPlayerList(client: RconClient): Promise<Array<PlayerListItem>> {
  const pl = await exec('bf2cc pl')(client).then(mapListPlayers);
  if (!pl) {
    throw new Error('Empty response');
  }

  return pl;
}

export async function getServerInfo(client: RconClient): Promise<ServerInfo> {
  const si = await exec('bf2cc si')(client).then(mapServerInfo);
  if (!si) {
    throw new Error('Empty response');
  }

  return si;
}

export function exec(command: string) {
  return async (client: RconClient) => client.send(command);
}

export type PollServerInfoCb = (
  serverInfo: ServerInfo,
  client: RconClient
) => Promise<PollServerStatus>;
export function pollServerInfo(callback: PollServerInfoCb) {
  return (client: RconClient) => {
    const interval = setInterval(intervalFn, POLL_INTERVAL);
    const timeout = setTimeout(stopPolling, POLL_MAX_DURATION);
    let errorAt: Moment | null = null;
    let waitingSince: Moment | null = moment();

    async function intervalFn() {
      try {
        if (moment().diff(errorAt, 'minutes') > 30) {
          return clearTimers();
        }

        const freshClient = await rcon(client.ip, client.port, client.password);
        const si = await getServerInfo(freshClient);
        info(
          'pollServerInfo',
          `${formatSecToMin(si.roundTime)} ${si.team1_Name} [${si.team1_tickets} - ${
            si.team2_tickets
          }] ${si.team2_Name}`
        );
        const status = await callback(si, freshClient);
        info('pollServerInfo', `Callback finished with status: ${status}`);

        if (status === 'ongoing') {
          errorAt = null;
          waitingSince = null;
        }
        if (status === 'finished') {
          return clearTimers();
        }
        if (status === 'waiting' && moment().diff(waitingSince, 'minutes') > 30) {
          info('pollServerInfo', `Server is idle, stops polling`);
          return clearTimers();
        }
      } catch (e) {
        error('pollServerInfo', e);
        errorAt = moment();
      }
    }
    function stopPolling() {
      info('pollServerInfo', `Polling timed out.`);
      clearInterval(interval);
    }
    function clearTimers() {
      clearInterval(interval);
      clearTimeout(timeout);
    }
  };
}
