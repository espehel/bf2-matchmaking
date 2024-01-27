import { MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  api,
  createServerName,
  getInitialServerMap,
  getServerVehicles,
} from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { generateServers } from '@bf2-matchmaking/server';

export async function startScheduledMatches() {
  const matchesToStart = matches.getScheduled().filter(isScheduledToStart);
  if (matchesToStart.length) {
    info('startScheduledMatches', `Starting ${matchesToStart.length} matches`);
    await Promise.all(matchesToStart.map(startMatch));
  }
}

function isScheduledToStart(match: ScheduledMatch) {
  const startsInMinutes = DateTime.fromISO(match.scheduled_at).diffNow('minutes').minutes;
  return startsInMinutes <= 10 && startsInMinutes >= -10;
}

async function startMatch(scheduledMatch: ScheduledMatch) {
  const { data: match, error } = await client().updateMatch(scheduledMatch.id, {
    status: MatchStatus.Ongoing,
    started_at: DateTime.now().toISO(),
  });

  const { data: matchServer } = await client().getMatchServer(scheduledMatch.id);
  const { data: instances } = await api.platform().getServers(scheduledMatch.id);
  if (matchServer?.locations.length && !instances?.length) {
    const results = await generateServers(scheduledMatch, matchServer.locations);

    const firstInstance = results.instances.at(0);
    if (firstInstance && !matchServer.active) {
      const { data: dns } = await api.platform().getServerDns(firstInstance.main_ip);
      await client().updateMatchServer(scheduledMatch.id, {
        active_server: dns?.name || firstInstance.main_ip,
      });
    }
  }

  if (error) {
    logErrorMessage(`Match ${scheduledMatch.id} failed to set status ongoing`, error, {
      match: scheduledMatch,
    });
  } else {
    logMessage(`Match ${match.id} started`, { match });
  }
}
