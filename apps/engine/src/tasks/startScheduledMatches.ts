import { MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import moment from 'moment';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

export async function startScheduledMatches() {
  const matchesToStart = matches.getScheduled().filter(isScheduledToStart);
  if (matchesToStart.length) {
    info('startScheduledMatches', `Starting ${matchesToStart.length} matches`);
    await Promise.all(matchesToStart.map(startMatch));
  }
}

function isScheduledToStart(match: ScheduledMatch) {
  const scheduled = moment(match.scheduled_at);
  const now = moment();
  return (
    scheduled.isAfter(now.subtract(15, 'minutes')) &&
    scheduled.isBefore(now.add(15, 'minutes'))
  );
}

async function startMatch(match: ScheduledMatch) {
  const { error } = await client().updateMatch(match.id, {
    status: MatchStatus.Ongoing,
    started_at: moment().toISOString(),
  });
  if (error) {
    logErrorMessage(`Match ${match.id} failed to start`, error, { match });
  } else {
    logMessage(`Match ${match.id} started`, { match });
  }
}
