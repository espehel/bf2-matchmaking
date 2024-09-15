import { error, info, verbose } from '@bf2-matchmaking/logging';
import {
  isDiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getWarmUpStartedEmbed, sendChannelMessage } from '@bf2-matchmaking/discord';
import { DateTime } from 'luxon';
import { putMatch } from '@bf2-matchmaking/redis/matches';
import { getServer } from '@bf2-matchmaking/redis/servers';

export const hasPlayedAllRounds = (config: MatchConfigsRow, roundsPlayed: number) =>
  roundsPlayed >= config.maps * 2;

export const isServerEmptied = (roundsPlayed: number, si: ServerInfo) =>
  roundsPlayed > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  roundsPlayed: number
) => Number(si.connectedPlayers) === match.players.length && roundsPlayed === 0;

export const isOngoingRound = (si: ServerInfo) => {
  si.currentGameStatus;
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

export async function updateMatchServer(matchId: number, serverAddress: string) {
  info(
    'updateMatchServer',
    `Match ${matchId}: Updating match server with ip ${serverAddress}`
  );
  await client().deleteAllMatchServers(matchId);
  const result = await client().createMatchServers(matchId, {
    server: serverAddress,
  });
  if (result.error) {
    error('updateMatchServer', result.error);
  }
  return result;
}

export async function setMatchLiveNow(matchId: number) {
  const live_at = DateTime.utc().toISO();
  verbose('setMatchLiveAt', `Match ${matchId}: Live at ${live_at}`);
  const updatedMatch = await client()
    .updateMatch(matchId, { live_at })
    .then(verifySingleResult);
  await putMatch(updatedMatch);
}

export async function syncMatchCache(matchId: number | string) {
  const updatedMatch = await client().getMatch(Number(matchId)).then(verifySingleResult);
  await putMatch(updatedMatch);
  return updatedMatch;
}

export async function broadcastWarmUpStarted(match: MatchesJoined, address: string) {
  const serverInfo = await getServer(address);
  if (isDiscordMatch(match)) {
    await sendChannelMessage(match.config.channel, {
      embeds: [getWarmUpStartedEmbed(match.id, address, serverInfo)],
    });
  }
}