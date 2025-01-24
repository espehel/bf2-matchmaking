import {
  DiscordConfig,
  isNotNull,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  info,
  logErrorMessage,
  logMessage,
  logWarnMessage,
} from '@bf2-matchmaking/logging';
import { getUserIds } from './utils';
import { toMatchPlayer, toMatchPlayerWithTeamAndRating } from '../../utils/player-utils';
import { findMapId } from './supabase-service';
import { Embed } from 'discord.js';
import { getPlayersByIdList } from './player-service';

export async function getMatch(matchId: number) {
  const { data, error } = await client().getMatch(matchId);
  if (error) {
    logErrorMessage('Failed to get match', error, { matchId });
  }
  return data;
}
export async function createMatch(config: DiscordConfig, status: MatchStatus) {
  const match = await client()
    .createMatchFromConfig(config.id, {
      status,
    })
    .then(verifySingleResult);

  logMessage(`Match ${match.id}: Created with status ${match.status}`, {
    match,
    config,
  });

  return match;
}

export async function createMatchPlayers(matchPlayers: Array<MatchPlayersInsert>) {
  const { data, error: playersError } = await client().createMatchPlayers(matchPlayers);
  info('createMatchPlayers', `Created match players ${JSON.stringify(data)}`);

  if (playersError) {
    logErrorMessage('Failed to create match players', playersError, {
      matchPlayers,
    });
  }
  return data;
}

export async function buildMatchMaps(embed: Embed) {
  const mapName = embed.fields?.find((f) => f.name === 'Map')?.value || null;
  const map = mapName ? await findMapId(mapName) : null;
  return [map].filter(isNotNull);
}

export async function createMatchMaps(matchId: number, maps: Array<number>) {
  const { data, error: mapsError } = await client().createMatchMaps(matchId, ...maps);
  info('createMatchMaps', `Created match maps ${JSON.stringify(data)}`);
  if (mapsError) {
    logErrorMessage('Failed to create match maps', mapsError, { maps });
  }

  return data;
}

export async function updateMatch(matchId: number, values: MatchesUpdate) {
  const match = await client().updateMatch(matchId, values).then(verifySingleResult);
  logMessage(`Match ${matchId}: Updated with status ${match.status}`, {
    match,
    values,
  });
  return match;
}

export async function buildMatchPlayersFromStartingEmbed(
  embed: Embed,
  matchId: number,
  configId: number
): Promise<Array<MatchPlayersInsert>> {
  const team1Ids = getUserIds(embed, 'USMC');
  const team2Ids = getUserIds(embed, 'MEC/PLA');

  if (team1Ids.length === 0) {
    logWarnMessage(`Match ${matchId}: No players found for "USMC"`);
  }
  if (team2Ids.length === 0) {
    logWarnMessage(`Match ${matchId}: No players found for "MEC/PLA"`);
  }

  const team1 = await getPlayersByIdList(team1Ids);
  const team2 = await getPlayersByIdList(team2Ids);

  const { data: ratings } = await client().getPlayerRatingsByIdList(
    team1Ids.concat(team2Ids),
    configId
  );
  const teams = [
    ...team1.map(toMatchPlayerWithTeamAndRating(matchId, 1, ratings || [])),
    ...team2.map(toMatchPlayerWithTeamAndRating(matchId, 2, ratings || [])),
  ];

  return teams;
}

export async function buildMatchPlayersFromDraftingEmbed(
  embed: Embed,
  matchId: number
): Promise<Array<MatchPlayersInsert>> {
  const playerIds = [
    ...getUserIds(embed, 'MEC/PLA'),
    ...getUserIds(embed, 'USMC'),
    ...getUserIds(embed, 'Unpicked'),
  ];
  const players = await getPlayersByIdList(playerIds);
  return players.map(toMatchPlayer(matchId));
}

export async function createMatchTeams(
  matchId: number,
  configId: number,
  teams: Array<MatchPlayersInsert>
) {
  await client().deleteAllMatchPlayersForMatchId(matchId);
  const { data, error: playersError } = await client().createMatchPlayers(teams);
  info('createMatchPlayers', `Create match players ${JSON.stringify(data)}`);

  if (playersError) {
    logErrorMessage('Failed to create match players', playersError, {
      teams,
      matchId,
      configId,
    });
    return null;
  }

  logMessage(`Match ${matchId}: Created teams`, {
    teams,
    data,
  });

  return data;
}
