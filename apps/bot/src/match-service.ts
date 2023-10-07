import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error, info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import moment from 'moment';
import { isNotNull, MatchStatus } from '@bf2-matchmaking/types';

interface CreateScheduledMatchOptions {
  config: number;
  home_team: string;
  away_team: string;
  maps: Array<string>;
  server: string | null;
  startTime: number;
}
export async function createScheduledMatch(options: CreateScheduledMatchOptions) {
  info('createScheduledMatch', JSON.stringify(options));
  const home_team = (
    await client().getTeamByDiscordRole(options.home_team).then(verifySingleResult)
  ).id;
  const away_team = (
    await client().getTeamByDiscordRole(options.away_team).then(verifySingleResult)
  ).id;

  const scheduled_at = moment(options.startTime).toISOString();

  const server = await findServer(options.server);

  const match = await client()
    .createMatchFromConfig(options.config)
    .then(verifySingleResult);
  logMessage(`Match ${match.id} created`, { match });
  const { data: updatedMatch, error: err } = await client().updateMatch(match.id, {
    home_team,
    away_team,
    scheduled_at,
    server,
    status: MatchStatus.Scheduled,
  });

  if (err) {
    logErrorMessage('Failed to update scheduled match', err, {
      match,
      scheduled_at,
      home_team,
      away_team,
      server,
    });
  }

  const maps = (await Promise.all(options.maps.map(findMap))).filter(isNotNull);
  const { data: matchMaps, error: mapErr } = await client().createMatchMaps(
    match.id,
    ...maps
  );
  if (mapErr) {
    logErrorMessage('Failed to insert maps', mapErr, { maps, match });
  }

  if (!err && !mapErr) {
    logMessage(`Match ${updatedMatch.id} scheduled`, {
      match: updatedMatch,
      maps: matchMaps,
    });
  }
}

async function findMap(mapName: string) {
  const { data } = await client().searchMap(mapName);
  if (data) {
    return data.id;
  }
  return null;
}

async function findServer(serverName: string | null) {
  if (!serverName) {
    return null;
  }

  const { data, error: err } = await client().getServerByNameSearch(serverName).single();

  if (err) {
    error('findServer', err);
  }

  if (data) {
    return data.ip;
  }
  return null;
}
