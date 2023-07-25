import { initServer } from '../net/web-admin-server';
import { info } from '@bf2-matchmaking/logging';
import { createClient } from '../net/rcon-client';
import invariant from 'tiny-invariant';
import {
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
  RoundsInsert,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { client } from '@bf2-matchmaking/supabase';
import { formatSecToMin } from '@bf2-matchmaking/utils';

export const startWebAdminListener = async (host: string) => {
  const port = 8002;
  const ip = '84.212.130.196';
  info('startWebAdminListener', `Initializing server...`);
  await initServer(port);

  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');
  info('startWebAdminListener', `Initializing client...`);
  const client = await createClient({
    host,
    port: 4711,
    password: process.env.RCON_PASSWORD,
  });
  if (client.connected) {
    info('startWebAdminListener', `Client connected, starting web admin`);
    const data = await client.send(`wa connect ${ip} ${port}`);
    info('startWebAdminListener', `web admin response: ${data}`);
  }
};

export const listenForMatchRounds = async (match: MatchesJoined) => {
  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');
  invariant(match.server?.ip, `Match ${match.id} does not have assigned server`);
  info('listenForMatchRounds', `Initializing client...`);
  const rconClient = await createClient({
    host: match.server.ip,
    port: 4711,
    password: process.env.RCON_PASSWORD,
  });

  if (!rconClient.connected) {
    info('listenForMatchRounds', `Client Failed to connect`);
    return;
  }

  info('listenForMatchRounds', `Client connected, starting to poll server info`);
  const rounds = [];
  let isWaitingForNextRound = false;
  const interval = setInterval(pollServerInfo, 10000);
  const timeout = setTimeout(stopPolling, 1000 * 3600 * 3);

  async function pollServerInfo() {
    const si = await rconClient.send('bf2cc si').then(mapServerInfo);
    invariant(si, 'Failed to get server info');

    if (!isEndOfRound(si)) {
      info(
        'listenForMatchRounds',
        `${formatSecToMin(si.roundTime)} ${si.team1_Name} [${si.team1_tickets} - ${
          si.team2_tickets
        }] ${si.team2_Name}`
      );
      isWaitingForNextRound = false;
      return;
    }
    if (isWaitingForNextRound) {
      info('listenForMatchRounds', `Waiting for next round...`);
      return;
    }
    isWaitingForNextRound = true;

    const pl = await rconClient.send('bf2cc pl').then(mapListPlayers);
    const round = await createRound(si, pl, match);
    if (!round) {
      info('listenForMatchRounds', `Failed to create round`);
      return;
    }

    rounds.push(round);
    const { data: insertedRound } = await client().createRound(round);
    info('listenForMatchRounds', `Created round ${insertedRound?.id}`);

    if (rounds.length >= 4) {
      const { data: updatedMatch } = await client().updateMatch(match.id, {
        status: MatchStatus.Closed,
      });
      info('listenForMatchRounds', `Closed match ${updatedMatch?.id} after 4 rounds`);
      clearInterval(interval);
      clearTimeout(timeout);
    }
  }
  async function stopPolling() {
    const { data: updatedMatch } = await client().updateMatch(match.id, {
      status: MatchStatus.Closed,
    });
    info('listenForMatchRounds', `Closed match ${updatedMatch?.id} after timeout`);
    clearInterval(interval);
  }
};

const isEndOfRound = (si: ServerInfo) => {
  if (parseInt(si.timeLeft) <= 0) {
    return true;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return true;
  }

  return false;
};

const createRound = async (
  si: ServerInfo,
  pl: Array<PlayerListItem> | null,
  match: MatchesJoined
): Promise<RoundsInsert | null> => {
  const { data: map } = await client().searchMap(si.currentMapName).single();

  if (!map || !match.server?.ip) {
    return null;
  }

  return {
    team1_name: si.team1_Name,
    team1_tickets: si.team1_tickets,
    team2_name: si.team2_Name,
    team2_tickets: si.team2_tickets,
    map: map.id,
    server: match.server.ip,
    match: match.id,
    si: JSON.stringify(si),
    pl: JSON.stringify(pl),
  };
};
