import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { api, isClosedMatch, isOpenMatch } from '@bf2-matchmaking/utils';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { retry, wait } from '@bf2-matchmaking/utils/src/async-actions';
import { broadcastMatchStart, joinMatchRoom, leaveMatchRoom } from '../state/match-rooms';

export async function handleMatchInserted(match: MatchesJoined) {
  if (isOpenMatch(match)) {
    matches.putMatch(match);
  }
  if (match.status === MatchStatus.Summoning) {
    await joinMatchRoom(match);
  }
  if (match.status === MatchStatus.Ongoing) {
    await handleMatchOngoing(match);
  }
}
export async function handleMatchStatusUpdate(match: MatchesJoined) {
  if (isOpenMatch(match)) {
    matches.putMatch(match);
  }
  if (isClosedMatch(match)) {
    matches.removeMatch(match);
  }

  if (match.status === MatchStatus.Summoning) {
    await joinMatchRoom(match);
  }
  if (match.status === MatchStatus.Ongoing) {
    await handleMatchOngoing(match);
    await broadcastMatchStart(match);
  }
  if (match.status === MatchStatus.Finished) {
    await handleMatchFinished(match);
  }
}

async function handleMatchOngoing(match: MatchesJoined) {
  const { data, error } = await api.rcon().postMatchLive(match.id, false);
  if (error) {
    logErrorMessage(`Match ${match.id} failed to start`, error, { match });
  } else {
    logMessage(`Match ${match.id} started`, { match, live: data });
  }
}
async function handleMatchFinished(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);
  const ip = matchServer?.server?.ip;
  if (ip) {
    await retry(() => deleteServer(match, ip), 5);
  }

  leaveMatchRoom(match);
}

function handleMatchSummoning(match: MatchesJoined) {
  joinMatchRoom(match);
}

async function deleteServer(match: MatchesJoined, ip: string) {
  await wait(30);
  const result = await api.platform().deleteServer(ip);
  if (result.data) {
    const { data: server } = await client().deleteServer(ip);
    const { data: rcon } = await client().deleteServerRcon(ip);
    logMessage(`Match ${match.id} deleted server ${ip}`, {
      ip,
      instance: result.data,
      server,
      rcon,
    });
  }
  if (result.error) {
    logErrorMessage(`Match ${match.id} failed to delete server`, result.error, {
      ip,
    });
  }
  return result;
}
