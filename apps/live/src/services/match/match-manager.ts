import { LiveMatch, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import {
  addMatch,
  getMatchPlayers,
  getMatchValues,
  setCachedMatchesJoined,
  setMatchValues,
} from '@bf2-matchmaking/redis';
import { getLiveServerByMatchId } from '../server/server-manager';
import { client, fallbackResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';

export async function createPendingMatch(match: MatchesJoined) {
  await setMatchValues(match.id, {
    state: 'pending',
    roundsPlayed: match.rounds.length,
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
    connectedPlayers,
    server,
  };
}

export async function initLiveMatches() {
  const matches = await client()
    .getMatchesWithStatus(MatchStatus.Ongoing)
    .then(fallbackResult([]));

  await Promise.all(matches.map(createPendingMatch));
  info('initLiveMatches', `Initialized ${matches.length} live matches`);
}
