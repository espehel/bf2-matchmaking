import {
  isNotNull,
  MatchesJoined,
  MatchPlayerResultsInsert,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { toPlayerRatingUpdate } from '@bf2-matchmaking/utils/src/results-utils';
import { logErrorMessage } from '@bf2-matchmaking/logging';
import { LiveMatch } from './LiveMatch';

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

export async function addTeamPlayerToLiveMatch(liveMatch: LiveMatch, playerHash: string) {
  try {
    const player = await client().getPlayerByKeyhash(playerHash).then(verifySingleResult);

    const homeTeamPlayer = liveMatch.match.home_team.players.find(
      (tp) => tp.player_id === player.id
    );
    if (homeTeamPlayer) {
      await client()
        .createMatchPlayer(liveMatch.match.id, player.id, {
          team: homeTeamPlayer.team_id,
          captain: homeTeamPlayer.captain,
        })
        .then(verifySingleResult);
    }

    const awayTeamPlayer = liveMatch.match.away_team.players.find(
      (tp) => tp.player_id === player.id
    );
    if (awayTeamPlayer) {
      await client()
        .createMatchPlayer(liveMatch.match.id, player.id, {
          team: awayTeamPlayer.team_id,
          captain: awayTeamPlayer.captain,
        })
        .then(verifySingleResult);
    }

    if (homeTeamPlayer || awayTeamPlayer) {
      const updatedMatch = await client()
        .getMatch(liveMatch.match.id)
        .then(verifySingleResult);
      liveMatch.setMatch(updatedMatch);
      return player;
    }
    return null;
  } catch (e) {
    logErrorMessage('Failed to add team player to match', e, { liveMatch, playerHash });
    return null;
  }
}
