import { Challenge } from '@bf2-matchmaking/types';

export function isOpenChallenge(challenge: Challenge) {
  return challenge.status === 'open';
}

export function hasTeam(teamId: number | undefined) {
  if (!teamId) {
    return () => false;
  }
  return (challenge: Challenge) =>
    challenge.home_team.id === teamId ||
    (challenge.away_team && challenge.away_team.id === teamId);
}
