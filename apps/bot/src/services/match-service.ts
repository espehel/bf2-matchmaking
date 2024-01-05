import { PubobotMatch } from './PubobotMatch';
import { DiscordConfig, MatchesUpdate, MatchStatus } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { getPlayersByIdList } from './player-service';
import { toMatchPlayer } from './utils';

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

export async function createMatchPlayers(
  pubMatch: PubobotMatch,
  playerIds: Array<string>
) {
  const players = await getPlayersByIdList(playerIds);
  const { data, error: playersError } = await client().createMatchPlayers(
    players.map(({ id }) => ({ player_id: id, match_id: pubMatch.match.id }))
  );
  if (playersError) {
    error('createMatch', playersError);
  }

  const updatedMatch = await client()
    .getMatch(pubMatch.match.id)
    .then(verifySingleResult);

  logMessage(`Match ${updatedMatch.id}: Added ${data?.length} players`, {
    match: updatedMatch,
    players,
    matchPlayers: data,
  });

  return updatedMatch;
}

export async function createMatchMap(pubMatch: PubobotMatch, map: number) {
  if (!map) {
    info('createMatchMap', 'No map found, returning original match.');
    return pubMatch.match;
  }

  const { data, error: mapsError } = await client().createMatchMaps(
    pubMatch.match.id,
    map
  );
  if (mapsError) {
    error('createMatch', mapsError);
  }

  const updatedMatch = await client()
    .getMatch(pubMatch.match.id)
    .then(verifySingleResult);

  logMessage(`Match ${updatedMatch.id}: Added map ${map}`, {
    match: updatedMatch,
    map,
    matchMaps: data,
  });

  return updatedMatch;
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

  const { data: ratings } = await client().getPlayerRatingsByIdList(
    team1.concat(team2).map((p) => p.id),
    pubMatch.match.config.id
  );

  await Promise.all([
    client().upsertMatchPlayers(
      team1.map(toMatchPlayer(pubMatch.match.id, 1, ratings || []))
    ),
    client().upsertMatchPlayers(
      team2.map(toMatchPlayer(pubMatch.match.id, 2, ratings || []))
    ),
  ]);

  const deletedPlayers = await Promise.all(
    pubMatch.match.players
      .filter((p) => !(team1Ids.includes(p.id) || team2Ids.includes(p.id)))
      .map((p) => client().deleteMatchPlayer(pubMatch.match.id, p.id))
  );

  const updatedMatch = await client()
    .getMatch(pubMatch.match.id)
    .then(verifySingleResult);

  logMessage(`Match ${updatedMatch.id}: Created teams`, {
    match: updatedMatch,
    team1,
    team2,
    deletedPlayers,
  });

  return updatedMatch;
}
