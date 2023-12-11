import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import { LiveMatch, LiveMatchOptions } from './LiveMatch';
import { info, logMessage } from '@bf2-matchmaking/logging';
import {
  setServerLiveMatch,
  isIdle,
  findServer,
  resetLiveMatchServers,
} from '../net/ServerManager';

const liveMatches = new Map<number, LiveMatch>();

export function getLiveMatches() {
  return Array.from(liveMatches.values());
}

export function removeLiveMatch(liveMatch: LiveMatch) {
  logMessage(`Match ${liveMatch.match.id}: Removing live match`, {
    match: JSON.stringify(liveMatch.match),
  });
  return liveMatches.delete(liveMatch.match.id);
}

export function findLiveMatch(matchId: number): LiveMatch | undefined {
  return liveMatches.get(matchId);
}

export function initLiveMatch(
  match: MatchesJoined,
  matchServer: MatchServer | null | undefined,
  options: LiveMatchOptions
) {
  let liveMatch = liveMatches.get(match.id);

  if (liveMatch) {
    liveMatch.setMatch(match);
    logMessage(`Match ${match.id}: Updated live match`, {
      match,
      options,
    });
  } else {
    liveMatch = new LiveMatch(match, options);
    liveMatches.set(match.id, liveMatch);
    logMessage(`Match ${match.id}: Initialized live match`, {
      match,
      options,
    });
  }

  if (matchServer && matchServer.server && isIdle(matchServer.server.ip)) {
    resetLiveMatchServers(liveMatch);
    setServerLiveMatch(matchServer.server.ip, liveMatch);
    liveMatch.setServer(matchServer);
    logMessage(`Match ${match.id}: Setting live match server`, {
      match,
      options,
    });
  }
  return liveMatch;
}

export async function updatePendingLiveMatches() {
  if (liveMatches.size === 0) {
    info('updatePendingLiveMatches', 'No live matches found');
    return;
  }
  for (const liveMatch of liveMatches.values()) {
    if (!liveMatch.isPending()) {
      continue;
    }

    if (liveMatch.hasValidMatch()) {
      const liveServer = findServer(liveMatch);
      if (liveServer && liveServer.isIdle()) {
        resetLiveMatchServers(liveMatch);
        liveServer.setLiveMatch(liveMatch);
        continue;
      }
    }

    if (liveMatch.isStale()) {
      await liveMatch.finish();
      continue;
    }

    info('updatePendingLiveMatches', `Match ${liveMatch.match.id} is pending...`);
  }
}
