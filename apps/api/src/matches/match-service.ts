import { LiveMatch, MatchesJoined } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import {
  addMatchesLive,
  getMatchLive,
  setMatchLive,
} from '@bf2-matchmaking/redis/matches';
import { getLiveServerByMatchId } from '../servers/server-service';

export async function createPendingMatch(match: MatchesJoined) {
  await setMatchLive(match.id, {
    state: 'pending',
    roundsPlayed: match.rounds.length,
    pendingSince: DateTime.now().toISO(),
  });
  await addMatchesLive(match.id.toString());
  return getMatch(match.id.toString());
}

export async function getMatch(matchId: string): Promise<LiveMatch | null> {
  const server = await getLiveServerByMatchId(matchId);
  const match = await getMatchLive(matchId);

  if (!match) {
    return null;
  }

  return {
    matchId: Number(matchId),
    ...match,
    roundsPlayed: match.roundsPlayed,
    server,
  };
}