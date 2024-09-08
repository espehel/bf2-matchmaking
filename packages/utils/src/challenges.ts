import { Challenge, TeamsJoined } from '@bf2-matchmaking/types';

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

export function isSignedUp(team: TeamsJoined) {
  return (challenge: Challenge) =>
    team.challenges.some((c) => c.config === challenge.config.id);
}
