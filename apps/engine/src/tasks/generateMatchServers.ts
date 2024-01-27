import { ScheduledMatch } from '@bf2-matchmaking/types';
import matches from '../state/matches';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { api } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { generateServers } from '@bf2-matchmaking/server';

export async function generateMatchServers() {
  const scheduledMatches = matches.getScheduled().filter(isScheduledToStart);
  if (scheduledMatches.length) {
    info(
      'generateMatchServers',
      `Generating servers for ${scheduledMatches.length} matches`
    );
    const instances = (
      await Promise.all(scheduledMatches.map(generateServerInstances))
    ).flat();
    info('generateMatchServers', `${instances.length} instances generated`);
  }
}

function isScheduledToStart(match: ScheduledMatch) {
  const startsInMinutes = DateTime.fromISO(match.scheduled_at).diffNow('minutes').minutes;
  return startsInMinutes <= 29;
}

async function generateServerInstances(scheduledMatch: ScheduledMatch) {
  const { data: matchServer } = await client().getMatchServer(scheduledMatch.id);
  const { data: instances } = await api.platform().getServers(scheduledMatch.id);
  if (!matchServer?.locations.length || instances?.length) {
    return [];
  }
  const results = await generateServers(scheduledMatch, matchServer.locations);

  if (results.errors.length) {
    logErrorMessage(
      `Match ${scheduledMatch.id} received errors while generating server instances.`,
      results.errors[0],
      {
        match: scheduledMatch,
        results,
      }
    );
  }

  logMessage(`Match ${scheduledMatch.id} generated ${results.instances.length} servers`, {
    match: scheduledMatch,
    matchServer,
    results,
  });

  return results.instances;
}
