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
    await handleMatchFinished(match);
  }
}

async function handleMatchFinished(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);
  if (!matchServer?.instance) {
    return;
  }

  const { data: instance } = await api.platform().deleteServer(matchServer.instance);
  if (instance) {
    await client().deleteServer(instance.tag);
    await client().deleteServerRcon(instance.tag);
  }
}
