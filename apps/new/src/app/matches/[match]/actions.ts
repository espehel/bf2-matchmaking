'use server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import moment from 'moment';
import { revalidatePath } from 'next/cache';
import { api } from '@bf2-matchmaking/utils';
import { getTeamMap } from '@bf2-matchmaking/utils/src/results-utils';

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
  const teamMap = getTeamMap(match.rounds.length);

  if (playersResult.error) {
    return playersResult;
  }

  const players = playersResult.data
    .filter((sp) => {
      const player = match.players.find((p) => p.keyhash === sp.keyhash);
      if (!player) {
        return false;
      }
      const team = match.teams.find((mp) => mp.player_id === player.id)?.team;
      if (!team) {
        return false;
      }
      if (teamMap[sp.getTeam] === team) {
        return false;
      }
      return true;
    })
    .map(({ index }) => index);

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
  }

  return result;
}
