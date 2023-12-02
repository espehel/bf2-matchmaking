import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { api, createServerDnsName } from '@bf2-matchmaking/utils';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';

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
    const { data: matchServer } = await client().getMatchServer(match.id);
    await api.platform().deleteServer(createServerDnsName(match.id));
    if (matchServer?.instance && matchServer?.server?.ip) {
      await api.rcon().deleteServerLive(matchServer.server.ip);
      await client().deleteServer(matchServer.server.ip);
      await client().deleteServerRcon(matchServer.server.ip);
    }
  }
}
