import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { api, createServerDnsName } from '@bf2-matchmaking/utils';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

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
    await handleMatchFinished(match);
  }
}

async function handleMatchFinished(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);
  if (!matchServer?.server?.ip) {
    return;
  }

  const { data, error } = await api.platform().deleteServer(matchServer.server.ip);
  if (data) {
    const { data: server } = await client().deleteServer(matchServer.server.ip);
    const { data: rcon } = await client().deleteServerRcon(matchServer.server.ip);
    logMessage(`Match ${match.id} deleted server ${matchServer.server.ip}`, {
      matchServer,
      instance: data.instance,
      server,
      rcon,
    });
  }
  if (error) {
    logErrorMessage(`Match ${match.id} failed to delete server`, error, { matchServer });
  }
}
