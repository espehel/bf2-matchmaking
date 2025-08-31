'use server';
import { matches, supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { EventMatchesUpdate, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { api, assertObj, assertString, getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  deleteGuildScheduledEvent,
  getMatchDescription,
  patchGuildScheduledEvent,
} from '@bf2-matchmaking/discord';
import { DateTime } from 'luxon';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { createToken } from '@bf2-matchmaking/auth/token';
import { ActionInput, ActionResult } from '@/lib/types/form';
import { getOptionalValueAsNumber, getValueAsNumber } from '@bf2-matchmaking/utils/form';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';

export async function removeMatchPlayer(matchId: number, playerId: string) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteMatchPlayer(matchId, playerId);

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
  const cookieStore = await cookies();
  const { data } = await supabase(cookieStore).getPlayerRating(playerId, config);
  const result = await supabase(cookieStore).createMatchPlayer(matchId, playerId, {
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
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateMatch(matchId, {
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
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateMatch(matchId, {
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
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const result = await api.v2.postMatchStart(matchId);
  logMessage(`Match ${matchId} started by ${player?.nick}`, { matchId, player, result });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function closeMatch(matchId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateMatch(matchId, {
    status: MatchStatus.Closed,
    closed_at: DateTime.now().toISO(),
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function deleteMatch(matchId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateMatch(matchId, {
    status: MatchStatus.Deleted,
  });

  const { data: player } = await supabase(cookieStore).getSessionPlayer();

  if (result.error) {
    logErrorMessage('Failed to delete match', result.error, { matchId, player });
    return result;
  }

  await supabase(cookieStore).deleteAllMatchServers(matchId);

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
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  const result = await api.v2.postServerPause(serverIp, createToken(player));

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function unpauseRound(matchId: number, serverIp: string) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  const result = await api.v2.postServerUnpause(serverIp, createToken(player));

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function restartRound(matchId: number, serverIp: string) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  const result = await api.v2.postServerExec(
    serverIp,
    { cmd: 'admin.restartMap' },
    createToken(player)
  );

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function restartServer(matchId: number, serverIp: string) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  const result = await api.v2.postServerExec(
    serverIp,
    { cmd: 'quit' },
    createToken(player)
  );

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
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const result = await supabase(cookieStore).createMatchServers(matchId, {
    server: serverIp,
  });

  if (result.error) {
    logErrorMessage('Failed to add server', result.error, { matchId, serverIp, player });
    return result;
  }
  const match = await supabase(cookieStore).getMatch(matchId).then(verifySingleResult);
  const { data: servers } = await supabase(cookieStore).getMatchServers(matchId);
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
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const { error } = await supabase(cookieStore).deleteAllMatchMaps(matchId);

  if (error) {
    logErrorMessage('Failed to delete maps before setting new', error, {
      matchId,
      maps,
      player,
    });
    return { data: null, error };
  }

  const result = await supabase(cookieStore).createMatchMaps(matchId, ...maps);

  if (result.error) {
    logErrorMessage('Failed to set maps', result.error, { matchId, maps, player });
    return result;
  }

  const { data: match } = await supabase(cookieStore).getMatch(matchId);
  const { data: server } = await supabase(cookieStore).getMatchServers(matchId);

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

  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateMatch(matchId, {
    scheduled_at,
  });

  if (result.error) {
    return result;
  }

  revalidatePath(`/matches/${matchId}`);
  return result;
}

export async function changeServerMap(serverIp: string, mapId: number) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  return api.v2.postServerMaps(serverIp, mapId, createToken(player));
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
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateEventMatch(match.id, matchUpdate);

  if (result.data) {
    revalidatePath(`/matches/${match.id}`);
  }
  return result;
}

export async function removeMatchServer(matchId: number, address: string) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteMatchServer(matchId, address);
  if (result.data) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function addMatchRole(formData: FormData): Promise<ActionResult> {
  const match_id = getValueAsNumber(formData, 'matchId');
  const name = publicMatchRoleSchema.parse(formData.get('role'));
  const count = getOptionalValueAsNumber(formData, 'count') ?? undefined;
  const priority = getOptionalValueAsNumber(formData, 'priority') ?? undefined;
  const result = await matches.roles.add({
    match_id,
    name,
    count,
    priority,
  });
  if (result.error) {
    return { success: null, error: result.error.message, ok: false };
  }
  revalidatePath(`/matches/${match_id}`);
  return { success: 'Role added', error: null, ok: true };
}
export async function removeMatchRole(input: ActionInput): Promise<ActionResult> {
  const role = publicMatchRoleSchema.parse(input.role);
  const matchId = Number(input.matchId);
  const result = await matches.roles.del(matchId, role);

  if (result.error) {
    return { success: null, error: result.error.message, ok: false };
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: 'Role removed', error: null, ok: true };
}
