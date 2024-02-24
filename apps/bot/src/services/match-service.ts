import { PubobotMatch } from './PubobotMatch';
import {
  DiscordConfig,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchPlayersRow,
  MatchStatus,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { getPlayersByIdList } from './player-service';
import { toMatchPlayer, toMatchPlayerWithTeamAndRating } from './utils';

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

export async function buildMatchPlayers(
  pubMatch: PubobotMatch,
  players: Array<PlayersRow>
): Promise<Array<MatchPlayersInsert>> {
  return players.map(toMatchPlayer(pubMatch.match.id));
}

export async function createMatchPlayers(
  pubMatch: PubobotMatch,
  matchPlayers: Array<MatchPlayersInsert>
) {
  await client().deleteAllMatchPlayersForMatchId(pubMatch.match.id);
  const { data, error: playersError } = await client().createMatchPlayers(matchPlayers);
  info('createMatchPlayers', `Create match players ${JSON.stringify(data)}`);

  if (playersError) {
    logErrorMessage('Failed to create match players', playersError, {
      pubMatch,
      matchPlayers,
    });
  }
  return data;
}

export async function createMatchMaps(pubMatch: PubobotMatch, maps: Array<number>) {
  const { data, error: mapsError } = await client().createMatchMaps(
    pubMatch.match.id,
    ...maps
  );
  if (mapsError) {
    logErrorMessage('Failed to create match maps', mapsError, { pubMatch, maps });
  }

  return data;
}

export async function updateMatch(pubMatch: PubobotMatch, values: MatchesUpdate) {
  const match = await client()
    .updateMatch(pubMatch.match.id, values)
    .then(verifySingleResult);
  logMessage(`Match ${pubMatch.match.id}: Updated with status ${match.status}`, {
    match,
    values,
  });
  return match;
}

export async function buildMatchTeams(
  matchId: number,
  configId: number,
  team1Ids: Array<string>,
  team2Ids: Array<string>
): Promise<[Array<PlayersRow>, Array<MatchPlayersInsert>]> {
  const team1 = await getPlayersByIdList(team1Ids);
  const team2 = await getPlayersByIdList(team2Ids);
  const players = [...team1, ...team2];

  const { data: ratings } = await client().getPlayerRatingsByIdList(
    team1Ids.concat(team2Ids),
    configId
  );
  const teams = [
    ...team1.map(toMatchPlayerWithTeamAndRating(matchId, 1, ratings || [])),
    ...team2.map(toMatchPlayerWithTeamAndRating(matchId, 2, ratings || [])),
  ];

  return [players, teams];
}
