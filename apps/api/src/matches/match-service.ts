import { LiveMatch, MatchesJoined, MatchesRow } from '@bf2-matchmaking/types';
import {
  getMatchLive,
  getMatchLiveSafe,
  initMatchLive,
} from '@bf2-matchmaking/redis/matches';
import { getLiveServer, getLiveServerByMatchId } from '../servers/server-service';
import { Match } from '@bf2-matchmaking/redis/types';
import { LiveServer, ServerStatus } from '@bf2-matchmaking/types/server';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { client } from '@bf2-matchmaking/supabase';
import { ServiceError } from '@bf2-matchmaking/services/error';

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

async function getServer(address: string) {
  const server = await Server.get(address);
  if (server && server.status !== ServerStatus.OFFLINE) {
    return server;
  }
  const { data: newServer } = await client().getServer(address);
  if (!newServer) {
    throw ServiceError.InvalidRequest('Server does not exist');
  }
  const initializedServer = await Server.init(newServer);
  if (!initializedServer) {
    throw ServiceError.InvalidRequest("Can't connect to match server");
  }
  return initializedServer;
}

export async function verifyServer(address: string): Promise<LiveServer | null> {
  const server = await getServer(address);
  if (server.status === ServerStatus.IDLE) {
    return getLiveServer(address);
  }
  if (server.status === ServerStatus.ACTIVE) {
    await Server.reset(address);
    return getLiveServer(address);
  }
  throw ServiceError.InvalidRequest('Server unavailable');
}
