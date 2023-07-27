import { initServer } from '../net/web-admin-server';
import {
  error,
  info,
  logAddMatchRound,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import { createClient } from '../net/rcon-client';
import invariant from 'tiny-invariant';
import {
  MatchesJoined,
  PlayerListItem,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { client } from '@bf2-matchmaking/supabase';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import { closeMatch, deleteMatch } from './matches';
import moment from 'moment';

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
    deleteMatch(match, 'Client failed to connect.');
    return;
  }

  info('listenForMatchRounds', `Client connected, starting to poll server info`);
  const rounds: Array<RoundsInsert> = [];
  let isWaitingForNextRound = false;
  const interval = setInterval(pollServerInfo, 10000);
  const timeout = setTimeout(stopPolling, 1000 * 3600 * 3);

  async function pollServerInfo() {
    const si = await rconClient.send('bf2cc si').then(mapServerInfo);
    invariant(si, 'Failed to get server info');

    if (!si && rounds.length > 0) {
      closeMatch(match, 'Lost connection to server during ongoing match', si);
      return clearTimers();
    }

    if (!si && rounds.length === 0) {
      deleteMatch(
        match,
        'Lost connection to server before a round has been finished',
        si
      );
      return clearTimers();
    }

    if (isIdleServer(match, si, rounds)) {
      deleteMatch(match, 'Idle server', si);
      return clearTimers();
    }

    if (hasPlayedAllRounds(rounds)) {
      closeMatch(match, 'All rounds played', si);
      return clearTimers();
    }

    if (isServerEmptied(rounds, si)) {
      closeMatch(match, 'Server emptied');
      return clearTimers();
    }

    if (isOngoingRound(si)) {
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
      return;
    }
    isWaitingForNextRound = true;
    info('listenForMatchRounds', `Round finished`);

    const pl = await rconClient.send('bf2cc pl').then(mapListPlayers);
    const round = await createRound(match, si, pl);
    if (round) {
      rounds.push(round);
    }
  }
  async function stopPolling() {
    closeMatch(match, 'Server poll duration timeout.');
    clearInterval(interval);
  }
  function clearTimers() {
    clearInterval(interval);
    clearTimeout(timeout);
  }
};

const isOngoingRound = (si: ServerInfo) => {
  if (parseInt(si.timeLeft) <= 0) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

const hasPlayedAllRounds = (rounds: Array<RoundsInsert>) => rounds.length >= 4;

const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';
const isIdleServer = (
  match: MatchesJoined,
  si: ServerInfo,
  rounds: Array<RoundsInsert>
) =>
  rounds.length === 0 &&
  si.connectedPlayers === '0' &&
  moment().diff(match.started_at, 'minutes') > 30;

const createRound = async (
  match: MatchesJoined,
  si: ServerInfo,
  pl: Array<PlayerListItem> | null
): Promise<RoundsRow | null> => {
  if (!match.server?.ip) {
    error('createRound', `Match ${match.id} does not have assigned server`);
    return null;
  }

  const { data: map, error: mapError } = await client()
    .searchMap(si.currentMapName)
    .single();

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return null;
  }

  const newRound = {
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
  logAddMatchRound(newRound, match, si, pl);
  const { data: insertedRound, error: insertError } = await client().createRound(
    newRound
  );

  if (insertError) {
    logSupabaseError('Failed to insert round', insertError);
  }

  return insertedRound;
};
