import { MatchesJoined } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { logErrorMessage } from '@bf2-matchmaking/logging';

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
