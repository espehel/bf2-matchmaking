import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error, info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { User, APIUser, GuildMember } from 'discord.js';
import { isNotNull, MatchStatus, PlayersRow } from '@bf2-matchmaking/types';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';

export async function upsertMembers(members: Array<GuildMember>) {
  const { data } = await client().upsertPlayers(
    members.map((m) => ({
      id: m.id,
      nick: m.displayName,
      avatar_url: m.user.avatarURL() || '',
    }))
  );
  return data ? data.map((p) => p.id) : [];
}
export async function getOrCreatePlayer({ id, username, avatar }: User | APIUser) {
  const { error, data } = await client().getPlayer(id);
  if (error) {
    info('getOrCreatePlayer', `Inserting Player <${username}> with id ${id}`);
    return client()
      .createPlayer({
        id,
        nick: username,
        avatar_url: avatar || '',
      })
      .then(verifySingleResult);
  }
  return data;
}
interface CreateScheduledMatchOptions {
  config: number;
  home_team: string;
  away_team: string;
  maps: Array<string>;
  server: string | null;
  startTime: string;
}
export async function createScheduledMatch(options: CreateScheduledMatchOptions) {
  info('createScheduledMatch', JSON.stringify(options));
  const home_team = (
    await client().getTeamByDiscordRole(options.home_team).then(verifySingleResult)
  ).id;
  const away_team = (
    await client().getTeamByDiscordRole(options.away_team).then(verifySingleResult)
  ).id;

  const server = await findServer(options.server);

  const match = await client()
    .createMatchFromConfig(options.config)
    .then(verifySingleResult);
  logMessage(`Match ${match.id} created`, { match });

  if (server) {
    await client().createMatchServers(match.id, {
      server,
    });
  }

  const { data: updatedMatch, error: err } = await client().updateMatch(match.id, {
    home_team,
    away_team,
    scheduled_at: options.startTime,
    status: MatchStatus.Scheduled,
  });

  if (err) {
    logErrorMessage('Failed to update scheduled match', err, {
      match,
      scheduled_at: options.startTime,
      home_team,
      away_team,
      server,
    });
  }

  const maps = (await Promise.all(options.maps.map(findMapId))).filter(isNotNull);
  const { data: matchMaps, error: mapErr } = await client().createMatchMaps(
    match.id,
    ...maps
  );
  if (mapErr) {
    logErrorMessage('Failed to insert maps', mapErr, { maps, match });
  }

  if (!err && !mapErr) {
    logMessage(`Match ${updatedMatch.id} scheduled for ${options.startTime}`, {
      match: updatedMatch,
      maps: matchMaps,
    });
  }
}

export async function findMapId(mapName: string): Promise<number | null> {
  const cachedMap = getCachedValue<number>(mapName);
  if (cachedMap) {
    return cachedMap;
  }

  const { data } = await client().searchMap(mapName);
  if (data) {
    setCachedValue(mapName, data.id);
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

export async function getPlayerByTeamspeakId(clid: string): Promise<PlayersRow | null> {
  const { data } = await client().getPlayerByTeamspeakId(clid);
  return data;
}

export function get4v4BetaConfig() {
  return client().getMatchConfig(20).then(verifySingleResult);
}
