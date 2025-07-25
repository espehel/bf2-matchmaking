import { MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { error, info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';
import { addMatchServer, getScheduled } from '@bf2-matchmaking/redis/matches';
import { createJob } from '@bf2-matchmaking/scheduler';
import { matchApi } from '../lib/match';

async function startScheduledMatches() {
  const scheduled = await getScheduled();
  const matchesToStart = scheduled.filter(isScheduledToStart);
  if (matchesToStart.length) {
    await Promise.all(matchesToStart.map(startMatch));
  }
  return matchesToStart.length;
}

function isScheduledToStart(match: ScheduledMatch) {
  const startsInMinutes = DateTime.fromISO(match.scheduled_at).diffNow('minutes').minutes;
  return startsInMinutes <= 29;
}

async function startMatch(match: ScheduledMatch) {
  try {
    const updatedMatch = await matchApi.update(match.id).commit({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
    const { data: matchServers } = await client().getMatchServers(match.id);
    if (matchServers && matchServers.servers.length) {
      await addMatchServer(match.id, ...matchServers.servers.map((s) => s.ip));
    }

    logMessage(`Match ${updatedMatch.id} is now ${updatedMatch.status}`, {
      match,
      updatedMatch,
      matchServers,
    });
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed start`, e, {
      match: match,
    });
  }
}

export function scheduleStartScheduledMatchesJob() {
  createJob('startScheduledMatches', startScheduledMatches)
    .on('failed', (name, err) => error(name, err))
    .on('finished', (name, output) => {
      if (output) {
        info(name, `Starting ${output} matches`);
      }
    })
    .schedule({ cron: '0,30 * * * *' });
}
