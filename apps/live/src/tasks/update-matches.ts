import { info } from '@bf2-matchmaking/logging';
import { getLiveMatches } from '../services/match/MatchManager';
import { findServer, resetLiveMatchServers } from '../services/server/ServerManager';
import { updateMatchServer } from '../services/match/matches';

export async function updateMatches() {
  const matches = getLiveMatches();
  if (matches.length === 0) {
    info('updateMatches', 'No live matches found');
    return;
  }
  for (const liveMatch of matches.values()) {
    if (!liveMatch.isPending()) {
      continue;
    }

    if (liveMatch.hasValidMatch()) {
      const liveServer = findServer(liveMatch);
      if (liveServer && liveServer.isIdle()) {
        resetLiveMatchServers(liveMatch);
        liveServer.setLiveMatch(liveMatch);
        await updateMatchServer(liveMatch.match.id, liveServer.address);
        continue;
      }
    }

    if (liveMatch.isStale()) {
      await liveMatch.finish();
      continue;
    }

    info('updateMatches', `Match ${liveMatch.match.id} is pending...`);
  }
}
