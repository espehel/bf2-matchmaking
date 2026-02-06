import { LiveMatch, MatchesJoined, MatchesRow } from '@bf2-matchmaking/types';
import {
  getMatchLive,
  getMatchLiveSafe,
  initMatchLive,
} from '@bf2-matchmaking/redis/matches';
import { getLiveServer, getLiveServerByMatchId } from '../servers/server-service';
import { Match } from '@bf2-matchmaking/redis/types';
import { LiveServer, ServerStatus } from '@bf2-matchmaking/types/server';
import { ServerApi } from '@bf2-matchmaking/services/server/Server';
import { client } from '@bf2-matchmaking/supabase';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { getServerOrInit } from '@bf2-matchmaking/services/server';

export async function createPendingMatch(
  match: MatchesRow | MatchesJoined
): Promise<Match> {
  await initMatchLive(match.id);
  return getMatchLive(match.id);
}

export async function getLiveMatch(matchId: string): Promise<LiveMatch | null> {
  const server = await getLiveServerByMatchId(matchId);
  const match = await getMatchLiveSafe(matchId);

  if (!match) {
    return null;
  }

  return {
    matchId: Number(matchId),
    ...match,
    roundsPlayed: Number(match.roundsPlayed),
    server,
  };
}

export async function verifyServer(address: string): Promise<LiveServer | null> {
  const server = await getServerOrInit(address);
  if (server.status === ServerStatus.IDLE) {
    return getLiveServer(address);
  }
  if (server.status === ServerStatus.ACTIVE) {
    await ServerApi.reset(address);
    return getLiveServer(address);
  }
  throw ServiceError.InvalidRequest('Server unavailable');
}
