import {
  isNotNull,
  MatchesJoined,
  MatchPlayerResultsInsert,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { toPlayerRatingUpdate } from '@bf2-matchmaking/utils/src/results-utils';
import { logErrorMessage } from '@bf2-matchmaking/logging';
import { Match } from './Match';

export async function updatePlayerRatings(
  playerResults: Array<MatchPlayerResultsInsert>,
  config: number
) {
  const playerRatings = await client()
    .getPlayerRatingsByIdList(
      playerResults.map((p) => p.player_id),
      config
    )
    .then(verifyResult);

  const playerUpdates = playerResults
    .map(toPlayerRatingUpdate(playerRatings, config))
    .filter(isNotNull);

  if (playerUpdates.length > 0) {
    return client().upsertPlayerRatings(playerUpdates).then(verifyResult);
  }

  return [];
}

export async function addTeamPlayerToLiveMatch(match: MatchesJoined, playerHash: string) {
  try {
    const teamPlayer = getTeamPlayer(match, playerHash);
    if (!teamPlayer) {
      return null;
    }

    await client()
      .createMatchPlayer(match.id, teamPlayer.player_id, {
        team: teamPlayer.team_id,
        captain: teamPlayer.captain,
      })
      .then(verifySingleResult);

    return teamPlayer.player;
  } catch (e) {
    logErrorMessage('Failed to add team player to match', e, { match, playerHash });
    return null;
  }
}

function getTeamPlayer(match: MatchesJoined, playerHash: string) {
  const homeTeamPlayer = match.home_team.players.find(
    (tp) => tp.player.keyhash === playerHash
  );
  if (homeTeamPlayer) {
    return homeTeamPlayer;
  }

  const awayTeamPlayer = match.away_team.players.find(
    (tp) => tp.player.keyhash === playerHash
  );
  return awayTeamPlayer || null;
}
