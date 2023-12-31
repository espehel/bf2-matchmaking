import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { api, isActiveMatch } from '@bf2-matchmaking/utils';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { retry, wait } from '@bf2-matchmaking/utils/src/async-actions';
import { joinRoom } from '../state/match-rooms';

export function handleMatchInserted(match: MatchesJoined) {
  if (isActiveMatch(match)) {
    matches.putMatch(match);
  }
  if (match.status === MatchStatus.Summoning) {
    joinRoom(match);
  }
}
export async function handleMatchStatusUpdate(match: MatchesJoined) {
  if (isActiveMatch(match)) {
    matches.putMatch(match);
  }
  if (match.status === MatchStatus.Summoning) {
    joinRoom(match);
  }
  if (match.status === MatchStatus.Finished) {
    matches.putMatch(match);
    handleMatchFinished(match);
  }
  if (match.status === MatchStatus.Closed) {
    matches.removeMatch(match);
  }
}

function handleMatchFinished(match: MatchesJoined) {
  client()
    .getMatchServer(match.id)
    .then(async ({ data: matchServer }) => {
      const ip = matchServer?.server?.ip;
      if (ip) {
        await retry(() => deleteServer(match, ip), 5);
      }
    });
}

function handleMatchSummoning(match: MatchesJoined) {
  joinRoom(match);
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
