'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import moment from 'moment';
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
  team: number,
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
  const result = await api.rcon().postMatchResults(matchId);

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

  const apiResult = await api.rcon().postMatchResults(matchId);
  revalidatePath(`/matches/${matchId}`);

  return apiResult;
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

  await supabase(cookies).deleteMatchServer(matchId);

  const match = result.data;
  const guild = match.config.guild;
  let events: unknown = null;
  if (guild && match.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) => deleteGuildScheduledEvent(guild, eventId))
    );
  }

  logMessage(`Match ${matchId}: Deleted by ${player?.full_name}`, {
    match,
    player,
    events,
  });

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function pauseRound(matchId: number, serverIp: string) {
  const result = await api.rcon().postServerPause(serverIp);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function unpauseRound(matchId: number, serverIp: string) {
  const result = await api.rcon().postServerUnpause(serverIp);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function restartRound(matchId: number, serverIp: string) {
  const result = await api.rcon().postServerExec(serverIp, { cmd: 'admin.restartMap' });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function restartServer(matchId: number, serverIp: string) {
  const result = await api.rcon().postServerExec(serverIp, { cmd: 'quit' });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function setTeams(match: MatchesJoined, serverIp: string) {
  const playersResult = await api.rcon().getServerPlayerList(serverIp);
  if (playersResult.error) {
    return playersResult;
  }

  const players = getPlayersToSwitch(match, playersResult.data);

  const result = await api.rcon().postServerPlayersSwitch(serverIp, { players });
  if (!result.error) {
    revalidatePath(`/matches/${match.id}`);
  }

  return result;
}

export async function setServer(matchId: number, serverIp: string) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const result = await supabase(cookies).upsertMatchServer({ id: matchId, ip: serverIp });

  if (result.error) {
    logErrorMessage('Failed to set server', result.error, { matchId, serverIp, player });
    return result;
  }
  const match = await supabase(cookies).getMatch(matchId).then(verifySingleResult);
  const guild = match.config.guild;

  let events: unknown = null;
  if (guild && match.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          description: getMatchDescription(match, 'TBD'),
        })
      )
    );
  }

  logMessage(`Match ${match.id}: Server ${serverIp} set by ${player?.full_name}`, {
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

  const guild = match?.config.guild;
  let events: unknown = null;
  if (guild && match?.events.length > 0) {
    events = await Promise.all(
      match.events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          description: getMatchDescription(match, 'TBD'),
        })
      )
    );
  }

  logMessage(
    `Match ${matchId}: Maps ${JSON.stringify(maps)} set by ${player?.full_name}`,
    {
      match,
      player,
      events,
      maps: result.data,
    }
  );

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function updateMatchScheduledAt(matchId: number, formData: FormData) {
  const { dateInput } = Object.fromEntries(formData);
  assertString(dateInput);

  const scheduled_at = moment(dateInput).utcOffset(120).toISOString();

  const result = await supabase(cookies).updateMatch(matchId, {
    scheduled_at,
  });

  if (result.error) {
    return result;
  }

  const apiResult = await api.rcon().postMatchResults(matchId);
  revalidatePath(`/matches/${matchId}`);

  return apiResult;
}

export async function changeServerMap(serverIp: string, mapId: number) {
  return api.rcon().postServerMaps(serverIp, mapId);
}
