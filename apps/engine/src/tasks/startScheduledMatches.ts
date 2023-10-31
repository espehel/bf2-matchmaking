import { MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { api } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';

export async function startScheduledMatches() {
  const matchesToStart = matches.getScheduled().filter(isScheduledToStart);
  if (matchesToStart.length) {
    info('startScheduledMatches', `Starting ${matchesToStart.length} matches`);
    await Promise.all(matchesToStart.map(startMatch));
  }
}

function isScheduledToStart(match: ScheduledMatch) {
  const startsInMinutes = DateTime.fromISO(match.scheduled_at).diffNow('minutes').minutes;
  return startsInMinutes <= 15 && startsInMinutes >= -15;
}

async function startMatch(scheduledMatch: ScheduledMatch) {
  const { data: match, error } = await client().updateMatch(scheduledMatch.id, {
    status: MatchStatus.Ongoing,
    started_at: DateTime.now().toISO(),
  });
  const { data: liveMatch, error: rconError } = await api
    .rcon()
    .postMatchLive(scheduledMatch.id, false);

  if (error) {
    logErrorMessage(`Match ${scheduledMatch.id} failed to set status ongoing`, error, {
      match: scheduledMatch,
    });
  } else if (rconError) {
    logErrorMessage(`Match ${match.id} failed to start live match`, rconError, {
      match,
    });
  } else {
    logMessage(`Match ${match.id} started`, { match, liveMatch });
  }
}
