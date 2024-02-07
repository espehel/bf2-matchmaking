import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { client, fallbackResult } from '@bf2-matchmaking/supabase';
import { info, logMessage } from '@bf2-matchmaking/logging';
import { Match } from './Match';

const liveMatches = new Map<number, Match>();

export function getLiveMatches() {
  return Array.from(liveMatches.values()).sort((a, b) => b.match.id - a.match.id);
}

export function removeLiveMatch(liveMatch: Match) {
  logMessage(`Match ${liveMatch.match.id}: Removing live match`, {
    match: JSON.stringify(liveMatch.match),
  });
  return liveMatches.delete(liveMatch.match.id);
}

export function findLiveMatch(matchId: number): Match | undefined {
  return liveMatches.get(matchId);
}

export function startLiveMatch(match: MatchesJoined) {
  let liveMatch = liveMatches.get(match.id);

  if (liveMatch) {
    liveMatch.setMatch(match);
    logMessage(`Match ${match.id}: Updated live match`, {
      match,
    });
  } else {
    liveMatch = new Match(match);
    liveMatches.set(match.id, liveMatch);
    logMessage(`Match ${match.id}: Started live match`, {
      match,
    });
  }

  return liveMatch;
}

export async function initLiveMatches() {
  const matches = await client()
    .getMatchesWithStatus(MatchStatus.Ongoing)
    .then(fallbackResult([]));

  await Promise.all(
    matches.map((match) => {
      startLiveMatch(match);
    })
  );
  info(
    'initLiveMatches',
    `Initialized ${liveMatches.size}/${matches.length} live matches`
  );
}
