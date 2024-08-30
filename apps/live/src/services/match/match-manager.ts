import { LiveMatch, MatchesJoined } from '@bf2-matchmaking/types';
import {
  addMatch,
  getMatchPlayers,
  getMatchValues,
  setCachedMatchesJoined,
  setHash,
} from '@bf2-matchmaking/redis';
import { getLiveServerByMatchId } from '../server/server-manager';
import { DateTime } from 'luxon';
import { Match } from '@bf2-matchmaking/redis/src/types';

export async function createPendingMatch(match: MatchesJoined) {
  await setHash<Match>('match', match.id, {
    state: 'pending',
    roundsPlayed: match.rounds.length.toString(),
    pendingSince: DateTime.now().toISO(),
    live_at: null,
  });
  await setCachedMatchesJoined(match);
  await addMatch(match.id.toString());
  return getMatch(match.id.toString());
}

export async function getMatch(matchId: string): Promise<LiveMatch | null> {
  const server = await getLiveServerByMatchId(matchId);
  const match = await getMatchValues(matchId);
  const connectedPlayers = await getMatchPlayers(matchId);

  if (!match) {
    return null;
  }

  return {
    matchId: Number(matchId),
    ...match,
    roundsPlayed: Number(match.roundsPlayed),
    connectedPlayers,
    server,
  };
}
