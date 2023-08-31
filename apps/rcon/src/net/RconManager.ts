import { RconClient } from './RconClient';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { PlayerListItem, LiveServerState, ServerInfo } from '@bf2-matchmaking/types';
import { info, logRconError } from '@bf2-matchmaking/logging';
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

export function switchPlayers(players: Array<string>) {
  return async (client: RconClient) => {
    const resultArray = [];
    for (const playerId of players) {
      const result = await client.send(`bf2cc switchplayer ${playerId} 3`);
      resultArray.push(result);
    }
    return resultArray;
  };
}

export function restartRound(client: RconClient) {
  return client.send('admin.restartMap');
}

export function exec(command: string) {
  return (client: RconClient) => client.send(command);
}

interface LiveServerBaseUpdate {
  state: Exclude<LiveServerState, 'prelive'>;
  payload: null;
}

interface LiveServerPreliveUpdate {
  state: 'prelive';
  payload: Array<string>;
}

export type LiveServerUpdate = LiveServerBaseUpdate | LiveServerPreliveUpdate;

export type PollServerInfoCb = (
  serverInfo: ServerInfo,
  playerList: Array<PlayerListItem>,
  ip: string
) => Promise<LiveServerUpdate>;
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
        const pl = si.connectedPlayers !== '0' ? await getPlayerList(freshClient) : [];
        verifyData(si, pl);
        info(
          'pollServerInfo',
          `${formatSecToMin(si.roundTime)} ${si.team1_Name} [${si.team1_tickets} - ${
            si.team2_tickets
          }] ${si.team2_Name}`
        );

        const { state, payload } = await callback(si, pl, freshClient.ip);
        info('pollServerInfo', `New state: ${state}`);

        if (state !== 'waiting') {
          errorAt = null;
          waitingSince = null;
        }

        if (state === 'prelive') {
          const spRes = await switchPlayers(payload)(freshClient);
          const rsRes = await restartRound(freshClient);
          info(
            'pollServerInfo',
            `Prelive executed: switch: "${spRes.join(', ')}", rs: "${rsRes}"`
          );
        }

        if (state === 'new_server') {
          clearTimers();
        }

        if (state === 'finished') {
          clearTimers();
        }

        if (state === 'waiting' && moment().diff(waitingSince, 'minutes') > 30) {
          info('pollServerInfo', `Server is idle, stops polling`);
          clearTimers();
        }
      } catch (e) {
        if (e instanceof Error) {
          logRconError(e.message, e, client.ip);
        }
        logRconError(JSON.stringify(e), e, client.ip);
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

function verifyData(si: ServerInfo, pl: Array<PlayerListItem>) {
  if (Number(si.connectedPlayers) !== pl.length) {
    throw new Error('Server info or player list have corrupt data.');
  }
}
