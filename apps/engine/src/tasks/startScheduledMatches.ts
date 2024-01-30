import { MatchesJoined, MatchStatus, ScheduledMatch } from '@bf2-matchmaking/types';
import matches from '../state/matches';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
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
  return startsInMinutes <= 29;
}

async function startMatch(match: ScheduledMatch) {
  try {
    const updatedMatch = await client()
      .updateMatch(match.id, {
        status: MatchStatus.Ongoing,
        started_at: DateTime.now().toISO(),
      })
      .then(verifySingleResult);

    const server = await setActiveServer(updatedMatch);

    logMessage(`Match ${updatedMatch.id} is now ${updatedMatch.status}`, {
      match,
      updatedMatch,
      server,
    });
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed start`, e, {
      match: match,
    });
  }
}

async function setActiveServer(match: MatchesJoined) {
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
}
