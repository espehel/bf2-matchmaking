'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { EventMatchesUpdate, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { api, assertString, getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  deleteGuildScheduledEvent,
  patchGuildScheduledEvent,
} from '@bf2-matchmaking/discord';
import { getMatchDescription } from '@bf2-matchmaking/discord/src/discord-scheduled-events';
import { DateTime } from 'luxon';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

export async function removeMatchPlayer(matchId: number, playerId: string) {
  const result = await supabase(cookies).deleteMatchPlayer(matchId, playerId);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function addMatchPlayer(
  matchId: number,
  playerId: string,
  team: number | undefined,
  config: number
) {
  const { data } = await supabase(cookies).getPlayerRating(playerId, config);
  const result = await supabase(cookies).createMatchPlayer(matchId, playerId, {
    team,
    rating: data?.rating || 1500,
  });

  if (result.error) {
    console.error(result.error);
    return result;
  }

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function reopenMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Finished,
    closed_at: null,
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function createResults(matchId: number) {
  const result = await api.live().postMatchResults(matchId);

  if (!result.error) {
    revalidatePath(`/results/${matchId}`);
  }
  return result;
}
export async function finishMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Finished,
  });

  if (result.error) {
    return result;
  }

  const apiResult = await api.live().postMatchResults(matchId);
  revalidatePath(`/matches/${matchId}`);

  return apiResult;
}

export async function startMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Ongoing,
    started_at: DateTime.now().toISO(),
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function closeMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Closed,
    closed_at: DateTime.now().toISO(),
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function deleteMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Deleted,
  });

  const { data: player } = await supabase(cookies).getSessionPlayer();

  if (result.error) {
    logErrorMessage('Failed to delete match', result.error, { matchId, player });
    return result;
  }

  await supabase(cookies).deleteAllMatchServers(matchId);

  const match = result.data;
  const guild = match.config.guild;
  let events: unknown = null;
  if (guild && match.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) => deleteGuildScheduledEvent(guild, eventId))
    );
  }

  logMessage(`Match ${matchId}: Deleted by ${player?.nick}`, {
    match,
    player,
    events,
  });

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function pauseRound(matchId: number, serverIp: string) {
  const result = await api.live().postServerPause(serverIp);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function unpauseRound(matchId: number, serverIp: string) {
  const result = await api.live().postServerUnpause(serverIp);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function restartRound(matchId: number, serverIp: string) {
  const result = await api.live().postServerExec(serverIp, { cmd: 'admin.restartMap' });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function restartServer(matchId: number, serverIp: string) {
  const result = await api.live().postServerExec(serverIp, { cmd: 'quit' });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function setTeams(match: MatchesJoined, serverIp: string) {
  const playersResult = await api.live().getServerPlayerList(serverIp);
  if (playersResult.error) {
    return playersResult;
  }

  const players = getPlayersToSwitch(match, playersResult.data);

  const result = await api.live().postServerPlayersSwitch(serverIp, { players });
  if (!result.error) {
    revalidatePath(`/matches/${match.id}`);
  }

  return result;
}

export async function addServer(matchId: number, serverIp: string) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const result = await supabase(cookies).createMatchServers(matchId, {
    server: serverIp,
  });

  if (result.error) {
    logErrorMessage('Failed to add server', result.error, { matchId, serverIp, player });
    return result;
  }
  const match = await supabase(cookies).getMatch(matchId).then(verifySingleResult);
  const { data: servers } = await supabase(cookies).getMatchServers(matchId);
  const guild = match.config.guild;

  let events: unknown = null;
  if (guild && match.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          description: getMatchDescription(match, servers?.servers),
        })
      )
    );
  }

  logMessage(`Match ${match.id}: Server ${serverIp} set by ${player?.nick}`, {
    match,
    player,
    events,
  });

  revalidatePath(`/matches/${matchId}`);
  revalidateTag('getServerPlayerList');

  return result;
}

export async function setMaps(matchId: number, maps: Array<number>) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const { error } = await supabase(cookies).deleteAllMatchMaps(matchId);

  if (error) {
    logErrorMessage('Failed to delete maps before setting new', error, {
      matchId,
      maps,
      player,
    });
    return { data: null, error };
  }

  const result = await supabase(cookies).createMatchMaps(matchId, ...maps);

  if (result.error) {
    logErrorMessage('Failed to set maps', result.error, { matchId, maps, player });
    return result;
  }

  const { data: match } = await supabase(cookies).getMatch(matchId);
  const { data: server } = await supabase(cookies).getMatchServers(matchId);

  const guild = match?.config.guild;
  let events: unknown = null;
  if (guild && match?.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          description: getMatchDescription(match, server?.servers),
        })
      )
    );
  }

  logMessage(`Match ${matchId}: Maps ${JSON.stringify(maps)} set by ${player?.nick}`, {
    match,
    player,
    events,
    maps: result.data,
  });

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function updateMatchScheduledAt(matchId: number, formData: FormData) {
  const { dateInput, timezone } = Object.fromEntries(formData);
  assertString(dateInput);
  assertString(timezone);

  const scheduled_at = DateTime.fromISO(dateInput, { zone: timezone }).toUTC().toISO();
  assertString(scheduled_at);

  const result = await supabase(cookies).updateMatch(matchId, {
    scheduled_at,
  });

  if (result.error) {
    return result;
  }
  const match = result.data;
  const guild = match.config.guild;
  let events: unknown = null;
  if (guild && match.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          scheduled_start_time: scheduled_at,
        })
      )
    );
  }

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function changeServerMap(serverIp: string, mapId: number) {
  return api.live().postServerMaps(serverIp, mapId);
}

export async function acceptMatchTime(
  match: MatchesJoined,
  team: 'home' | 'away',
  clear: boolean
) {
  const matchUpdate: EventMatchesUpdate = {};
  if (clear) {
    matchUpdate['home_accepted'] = false;
    matchUpdate['away_accepted'] = false;
  }
  if (team === 'home') {
    matchUpdate['home_accepted'] = true;
  }
  if (team === 'away') {
    matchUpdate['away_accepted'] = true;
  }
  const result = await supabase(cookies).updateEventMatch(match.id, matchUpdate);

  if (result.data) {
    revalidatePath(`/matches/${match.id}`);
  }
  return result;
}

export async function removeMatchServer(matchId: number, address: string) {
  const result = await supabase(cookies).deleteMatchServer(matchId, address);
  if (result.data) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}
