import { PubobotMatch } from './PubobotMatch';
import {
  DiscordConfig,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchStatus,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { getPlayersByIdList } from './player-service';
import { toMatchPlayerWithRating, toMatchPlayerWithTeam } from './utils';

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
  const { data: ratings } = await client().getPlayerRatingsByIdList(
    players.map((p) => p.id),
    pubMatch.match.config.id
  );
  return players.map(toMatchPlayerWithRating(pubMatch.match.id, ratings || []));
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

export async function createMatchTeams(
  pubMatch: PubobotMatch,
  team1Ids: Array<string>,
  team2Ids: Array<string>
) {
  const team1 = await getPlayersByIdList(team1Ids);
  const team2 = await getPlayersByIdList(team2Ids);

  const results = await Promise.all([
    client().upsertMatchPlayers(team1.map(toMatchPlayerWithTeam(pubMatch.match.id, 1))),
    client().upsertMatchPlayers(team2.map(toMatchPlayerWithTeam(pubMatch.match.id, 2))),
  ]);

  const deletedPlayers = await Promise.all(
    pubMatch.match.players
      .filter((p) => !(team1Ids.includes(p.id) || team2Ids.includes(p.id)))
      .map((p) => client().deleteMatchPlayer(pubMatch.match.id, p.id))
  );

  return [results[0].data, results[1].data, deletedPlayers.map((p) => p.data)];
}
