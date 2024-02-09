import { MatchesJoined, MatchStatus, ServersRow } from '@bf2-matchmaking/types';
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
  const { data: matchServer } = await client().getMatchServer(match.id);
  const [liveMatch, liveServer] = await startLiveMatch(
    match,
    matchServer?.active || null
  );
  if (liveMatch) {
    logMessage(`Match ${match.id} live tracking started`, {
      match,
      liveMatch,
      liveServer,
    });
  }
}
async function handleMatchFinished(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);
  const ip = matchServer?.active?.ip;
  if (ip) {
    const { data: instance } = await api.platform().getServer(ip);
    if (instance) {
      await retry(() => deleteServer(match, ip), 5);
    }
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

async function startLiveMatch(
  match: MatchesJoined,
  server: ServersRow | null
): Promise<[unknown, unknown]> {
  const { data: liveMatch, error } = await api.live().postMatch(match.id);
  if (error) {
    logErrorMessage(`Match ${match.id} failed to start live match`, error, {
      match,
    });
    return [null, null];
  }

  if (!server) {
    return [liveMatch, null];
  }
  const { data: liveServer, error: liveServerError } = await api
    .live()
    .postMatchServer(match.id, server.ip, false);
  if (liveServerError) {
    logErrorMessage(
      `Match ${match.id} failed to set live match server`,
      liveServerError,
      {
        match,
        server,
        liveMatch,
      }
    );
  }
  return [liveMatch, liveServer];
}
