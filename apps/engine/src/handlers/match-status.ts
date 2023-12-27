import {
  Instance,
  MatchesJoined,
  MatchServer,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { api, createServerDnsName } from '@bf2-matchmaking/utils';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { retry, wait } from '@bf2-matchmaking/utils/src/async-actions';

export async function handleMatchStatusUpdate(
  match: MatchesJoined,
  prevStatus: MatchStatus
) {
  if (match.status === MatchStatus.Scheduled) {
    matches.pushScheduledMatch(match);
  }
  if (prevStatus === MatchStatus.Scheduled) {
    matches.removeScheduledMatch(match);
  }
  if (match.status === MatchStatus.Ongoing) {
    matches.pushActiveMatch(match);
  }
  if (prevStatus === MatchStatus.Ongoing) {
    matches.removeActiveMatch(match);
  }
  if (match.status === MatchStatus.Finished) {
    handleMatchFinished(match);
  }
}

async function handleMatchFinished(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);
  const ip = matchServer?.server?.ip;
  if (ip) {
    await retry(() => deleteServer(match, ip), 5);
  }
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
