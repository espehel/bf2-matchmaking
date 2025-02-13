import { MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';
import { addMatchServer, getScheduled } from '@bf2-matchmaking/redis/matches';
import cron from 'node-cron';
import { Match } from '@bf2-matchmaking/services/matches/Match';

async function startScheduledMatches() {
  const scheduled = await getScheduled();
  const matchesToStart = scheduled.filter(isScheduledToStart);
  if (matchesToStart.length) {
    info('startScheduledMatches', `Starting ${matchesToStart.length} matches`);
    await Promise.all(matchesToStart.map(startMatch));
  }
}

function isScheduledToStart(match: ScheduledMatch) {
  const startsInMinutes = DateTime.fromISO(match.scheduled_at).diffNow('minutes').minutes;
  return startsInMinutes <= 29;
}

async function startMatch(match: ScheduledMatch) {
  try {
    const updatedMatch = await Match.update(match.id).commit({
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

/*async function setActiveServer(match: MatchesJoined) {
  const { data: matchServer } = await client().getMatchServer(match.id);

  if (matchServer?.active) {
    return matchServer.active;
  }

  const { data: instances } = await api.platform().getServers(match.id);
  if (!instances || !instances.length) {
    return null;
  }
  const firstInstance = instances[0];
  const { data: dns } = await api.platform().getServerDns(firstInstance.main_ip);
  const { data: server, error } = await client().getServer(
    dns?.name || firstInstance.main_ip
  );
  if (error) {
    logErrorMessage(`Match ${match.id} failed to get generated server`, error, {
      match,
      matchServer,
      instances,
      dns,
    });
    return null;
  }

  const { error: upsertError } = await client().upsertMatchServer({
    id: match.id,
    active_server: server.ip,
  });
  if (upsertError) {
    logErrorMessage(`Match ${match.id} failed to set generated server`, error, {
      match,
      matchServer,
      instances,
      dns,
      server,
    });
    return null;
  }

  return server;
}*/

export const startScheduledMatchesTask = cron.schedule(
  '0,30 * * * *',
  startScheduledMatches,
  {
    scheduled: false,
  }
);
