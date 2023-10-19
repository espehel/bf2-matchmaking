import { isServerMatch, MatchesJoined } from '@bf2-matchmaking/types';
import { LiveMatch, LiveMatchOptions } from './LiveMatch';
import { info, logMessage } from '@bf2-matchmaking/logging';
import {
  setServerLiveMatch,
  isIdle,
  findServer,
  resetLiveMatchServers,
} from '../net/ServerManager';

const liveMatches = new Map<number, LiveMatch>();

export function removeLiveMatch(liveMatch: LiveMatch) {
  logMessage(`Match ${liveMatch.match.id}: Removing live match`, {
    match: JSON.stringify(liveMatch.match),
  });
  return liveMatches.delete(liveMatch.match.id);
}

export function findLiveMatch(matchId: number): LiveMatch | undefined {
  return liveMatches.get(matchId);
}

export function initLiveMatch(match: MatchesJoined, options: LiveMatchOptions) {
  if (liveMatches.has(match.id)) {
    return null;
  }

  const liveMatch = new LiveMatch(match, options);
  liveMatches.set(match.id, liveMatch);

  if (isServerMatch(match) && isIdle(match.server.ip)) {
    setServerLiveMatch(match.server.ip, liveMatch);
  }
  return liveMatch;
}

export function updateLiveMatches() {
  if (liveMatches.size === 0) {
    info('updateLiveMatches', 'No live matches found');
    return;
  }
  for (const liveMatch of liveMatches.values()) {
    if (liveMatch.isWaiting()) {
      const liveServer = findServer(liveMatch);
      if (liveServer && liveServer.isIdle()) {
        resetLiveMatchServers(liveMatch);
        liveServer.setLiveMatch(liveMatch);
      }
    }
  }
}
