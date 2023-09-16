import { ServerMatch, ServerRconsRow } from '@bf2-matchmaking/types';
import { pollServerInfo, rcon } from '../net/RconManager';
import { LiveMatch, LiveMatchOptions } from './LiveMatch';
import { logMessage } from '@bf2-matchmaking/logging';

const liveMatches = new Map<number, LiveMatch>();

export function removeLiveMatch(liveMatch: LiveMatch) {
  logMessage(
    `Match ${liveMatch.match.id}: Removing live match from ${liveMatch.match.server.ip}`,
    {
      match: JSON.stringify(liveMatch.match),
    }
  );
  return liveMatches.delete(liveMatch.match.id);
}

export function findLiveMatch(matchId: number): LiveMatch | undefined {
  return liveMatches.get(matchId);
}

export function startLiveMatch(
  match: ServerMatch,
  server: ServerRconsRow,
  options: LiveMatchOptions
) {
  let liveMatch = findLiveMatch(match.id);
  if (liveMatch) {
    if (liveMatch.match.server.ip === server.id) {
      return;
    }
    logMessage(
      `Match ${match.id}: Updating live match server from ${liveMatch.match.server.ip} to ${server.id}`,
      {
        match: JSON.stringify(match),
        oldMatch: JSON.stringify(liveMatch.match),
      }
    );

    liveMatch.setOptions(options);
    liveMatch.setMatch(match);
  } else {
    liveMatch = new LiveMatch(match, options);
    liveMatches.set(match.id, liveMatch);
    logMessage(`Match ${match.id}: Starting live match on server ${server.id}`, {
      match: JSON.stringify(match),
    });
  }
  rcon(server.id, server.rcon_port, server.rcon_pw).then(pollServerInfo(liveMatch));
}
