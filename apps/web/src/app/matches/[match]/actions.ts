'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { MatchesJoined, MatchPlayersRow, MatchStatus } from '@bf2-matchmaking/types';
import moment from 'moment';
import { revalidatePath, revalidateTag } from 'next/cache';
import { api, assertString, getPlayersToSwitch } from '@bf2-matchmaking/utils';

export async function removeMatchPlayer(matchId: number, playerId: string) {
  const result = await supabase(cookies).deleteMatchPlayer(matchId, playerId);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function addMatchPlayer(matchId: number, playerId: string, team: number) {
  const result = await supabase(cookies).createMatchPlayer(matchId, playerId, { team });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}
export async function startPolling(matchId: number) {
  return api.rcon().postMatchLive(matchId, false);
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
    closed_at: moment().toISOString(),
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

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

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
  const result = await supabase(cookies).updateMatch(matchId, {
    server: serverIp,
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
    revalidateTag('getServerPlayerList');
  }

  return result;
}

export async function setMaps(matchId: number, maps: Array<number>) {
  const { error } = await supabase(cookies).deleteAllMatchMaps(matchId);
  if (error) {
    return { data: null, error };
  }

  const result = await supabase(cookies).createMatchMaps(matchId, ...maps);

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

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
