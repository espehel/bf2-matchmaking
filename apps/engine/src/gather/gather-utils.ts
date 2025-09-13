import { isTruthy, MatchesJoined } from '@bf2-matchmaking/types';

export function getMatchTeam(match: MatchesJoined, team: 1 | 2) {
  const gatherTeam = match.teams
    .filter((mp) => mp.team === team)
    .map((mp) => match.players.find((p) => p.id === mp.player_id)?.teamspeak_id)
    .filter(isTruthy);
  if (gatherTeam.length === match.config.size / 2) {
    return gatherTeam;
  }
  throw new Error(`Invalid match state: team ${team} has not enough valid players`);
}
