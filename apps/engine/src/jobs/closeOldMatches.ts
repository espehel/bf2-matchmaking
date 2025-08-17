import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';
import { getWithStatus } from '@bf2-matchmaking/redis/matches';
import cron from 'node-cron';
import { Job } from '@bf2-matchmaking/scheduler';
import { matchApi, matchService } from '../lib/match';

const startedStatuses = [
  MatchStatus.Summoning,
  MatchStatus.Drafting,
  MatchStatus.Ongoing,
  MatchStatus.Finished,
];

async function closeOldMatches() {
  const { data: openMatches } = await client().getMatchesWithStatus(MatchStatus.Open);
  if (openMatches && openMatches.length > 0) {
    info('closeOldMatches', `Soft deleting ${openMatches.length} stale open matches`);
    for (const match of openMatches) {
      await matchApi.remove(match.id, MatchStatus.Deleted);
    }
  }

  const started = await getWithStatus(...startedStatuses);
  const oldMatches = started.filter(isOlderThan3Hours);
  info('closeOldMatches', `Handling ${oldMatches.length} old matches`);

  const matchesWithRounds = oldMatches.filter((m) => m.rounds.length > 0);
  if (matchesWithRounds.length) {
    info('closeOldMatches', `Closing ${matchesWithRounds.length} matches with rounds`);
    await Promise.all(matchesWithRounds.map(close));
  }

  const matchesWithoutRounds = oldMatches.filter((m) => m.rounds.length === 0);
  if (matchesWithoutRounds.length) {
    info('closeOldMatches', `Force closing ${oldMatches.length} matches without rounds.`);
    await Promise.all(matchesWithoutRounds.map(forceClose));
  }
  return oldMatches.length;
}

function isOlderThan3Hours(match: MatchesJoined) {
  return match.started_at
    ? DateTime.fromISO(match.started_at).diffNow('hours').hours < -3
    : true;
}

async function close(match: MatchesJoined) {
  const { errors } = await matchService.closeMatch(match);
  if (errors) {
    await forceClose(match);
  }
}

async function forceClose(match: MatchesJoined) {
  const removedMatch = await matchApi.remove(match.id, MatchStatus.Closed);
  logMessage(`Match ${match.id} force closed`, { removedMatch });
}

export const closeOldMatchesTask = cron.schedule('0 0,8,16 * * *', closeOldMatches, {
  scheduled: false,
});

export function scheduleCloseOldMatchesJob() {
  Job.create('closeOldMatches', closeOldMatches)
    .on('scheduled', (name, time) =>
      info(name, `Scheduled at ${DateTime.fromMillis(time).toFormat('D, TT')}`)
    )
    .on('started', (name, input) => info(name, `Started with input ${input}`))
    .on('failed', (name, err) => error(name, err))
    .on('finished', (name, output) =>
      info(name, `Finished with ${output} old matches processed`)
    )
    .schedule({ cron: '0 0,8,16 * * *' });
}
