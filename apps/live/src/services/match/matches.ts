import {
  error,
  info,
  logChangeMatchStatus,
  logErrorMessage,
  logMessage,
} from '@bf2-matchmaking/logging';
import {
  isDiscordMatch,
  LiveInfo,
  LiveMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchProcessError,
  MatchServer,
  MatchStatus,
  RoundsInsert,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { Match } from './Match';
import {
  calculateMatchResults,
  calculatePlayerResults,
  withJoinTime,
  withMixRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import { updatePlayerRatings } from './players';
import {
  getLiveMatchEmbed,
  getMatchResultsEmbed,
  getWarmUpStartedEmbed,
  sendChannelMessage,
  LOG_CHANNEL_ID,
  getDebugMatchResultsEmbed,
} from '@bf2-matchmaking/discord';
import { mapToKeyhashes } from '@bf2-matchmaking/utils/src/round-utils';
import { getJoinmeHref, hasNotKeyhash } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';

export const finishMatch = async (match: MatchesJoined, liveInfo: LiveInfo | null) => {
  logChangeMatchStatus(MatchStatus.Finished, match, liveInfo);
  const { data: updatedMatch, error } = await client().updateMatch(match.id, {
    status: MatchStatus.Finished,
  });
  if (error) {
    logErrorMessage(`Match ${match.id} failed to finish`, error);
    return;
  }

  try {
    if (updatedMatch.rounds.length === 0) {
      await client()
        .updateMatch(updatedMatch.id, {
          status: MatchStatus.Closed,
          closed_at: DateTime.now().toISO(),
        })
        .then(verifySingleResult);
      logMessage(
        `Match ${updatedMatch.id} has no rounds, closing match without creating results.`,
        {
          match: updatedMatch,
        }
      );
      return;
    }

    await closeMatch(updatedMatch);
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed to close`, e);
  }
};
export const closeMatch = async (match: MatchesJoined) => {
  let errors = validateMatch(match);

  let fixedMatch;
  if (errors.includes('MISSING_PLAYERS')) {
    fixedMatch = await fixMissingMatchPlayers(match);
    if (fixedMatch) {
      errors = validateMatch(fixedMatch);
    }
  }

  if (errors.length > 0) {
    logMessage(`Match ${match.id} is not valid, no results created.`, {
      match,
      errors,
    });
    return { result: null, errors };
  }

  const results = await processResults(fixedMatch || match);

  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Closed,
      closed_at: DateTime.now().toISO(),
    })
    .then(verifySingleResult);
  logChangeMatchStatus(MatchStatus.Closed, match);
  return { results, errors: null };
};

function validateMatch(match: MatchesJoined): Array<MatchProcessError> {
  const errors: Array<MatchProcessError> = [];
  if (match.config.maps * 2 < match.rounds.length) {
    errors.push('EXTRA_ROUNDS');
  }
  if (match.config.maps * 2 > match.rounds.length) {
    errors.push('MISSING_ROUNDS');
  }
  if (!validateMatchPlayers(match)) {
    errors.push('MISSING_PLAYERS');
  }
  return errors;
}

function validateMatchPlayers(match: MatchesJoined) {
  const playerKeys = mapToKeyhashes(match.rounds);

  return match.players.every(
    (player) => player.keyhash && playerKeys.includes(player.keyhash)
  );
}

export async function processResults(match: MatchesJoined) {
  const [resultsHome, resultsAway] = calculateMatchResults(match);
  const data = await client()
    .createMatchResult(resultsHome, resultsAway)
    .then(verifyResult);

  let playerResults = calculatePlayerResults(match);

  if (match.config.type === 'Mix') {
    playerResults = playerResults
      .map(withMixRatingIncrement(match, resultsHome, resultsAway))
      .map(withJoinTime(match));
  }

  await client()
    .createMatchPlayerResults(...playerResults)
    .then(verifyResult);

  const updatedRatings = await updatePlayerRatings(playerResults, match.config.id);
  logMessage(`Match ${match.id} results created`, {
    match,
    resultsHome,
    resultsAway,
    playerResults,
    updatedRatings,
  });
  if (isDiscordMatch(match)) {
    await sendChannelMessage(match.config.channel, {
      embeds: [getMatchResultsEmbed(match, [data[0], data[1]])],
    });
  }
  if (match.config.type === 'Mix') {
    await sendChannelMessage(LOG_CHANNEL_ID, {
      embeds: [getDebugMatchResultsEmbed(match, [data[0], data[1]], playerResults)],
    });
  }

  return data;
}

export const hasPlayedAllRounds = (
  config: MatchConfigsRow,
  rounds: Array<RoundsInsert>
) => rounds.length >= config.maps * 2;

export const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  rounds: Array<RoundsInsert>
) => Number(si.connectedPlayers) === match.players.length && rounds.length === 0;

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

export async function setLiveAt(liveMatch: Match) {
  if (liveMatch.match.live_at) {
    return;
  }

  const { data } = await client().updateMatch(liveMatch.match.id, {
    live_at: DateTime.now().toISO(),
  });

  if (data) {
    liveMatch.setMatch(data);
  }
}

export async function sendLiveMatchServerMessage(liveMatch: Match) {
  if (liveMatch.matchServer?.server) {
    const joinmeHref = await getJoinmeHref(
      liveMatch.matchServer.server.ip,
      liveMatch.matchServer.server.port
    );
    await sendChannelMessage(LOG_CHANNEL_ID, {
      embeds: [
        getLiveMatchEmbed(liveMatch.match, liveMatch.matchServer.server, joinmeHref),
      ],
    });
    logMessage(
      `Channel ${LOG_CHANNEL_ID}: LiveMatch created for Match ${liveMatch.match.id}`,
      { liveMatch }
    );
  }
}
export async function updateLiveMatchServer(liveMatch: Match, liveInfo: LiveInfo) {
  if (liveInfo.ip === liveMatch.matchServer?.server?.ip) {
    return;
  }

  const matchServer = await updateServer(liveMatch, liveInfo.ip);
  if (isDiscordMatch(liveMatch.match) && matchServer?.server) {
    liveMatch.setServer(matchServer);

    const joinmeHref = await getJoinmeHref(
      matchServer.server.ip,
      matchServer.server.port
    );
    await sendChannelMessage(liveMatch.match.config.channel, {
      embeds: [
        getWarmUpStartedEmbed(
          liveMatch.match,
          matchServer.server,
          liveInfo.serverName,
          joinmeHref
        ),
      ],
    });
    logMessage(
      `Channel ${liveMatch.match.config.channel}: LiveMatch server updated to ${liveInfo.serverName} for Match ${liveMatch.match.id}`,
      { liveMatch, liveInfo, matchServer }
    );
  }
}

export async function updateServer(
  liveMatch: Match,
  server: string
): Promise<MatchServer | null> {
  const result = await client().upsertMatchServer({
    id: liveMatch.match.id,
    server,
  });

  if (result.error || !result.data.server) {
    logErrorMessage(
      `Match ${liveMatch.match.id}: Failed to update server ${server} for LiveMatch`,
      result.error,
      { match: Match }
    );
    return null;
  }

  return result.data;
}

export async function updateMatchServer(matchId: number, serverAddress: string) {
  info(
    'updateMatchServer',
    `Match ${matchId}: Upserting match server with ip ${serverAddress}`
  );
  const result = await client().createMatchServer({
    id: matchId,
    server: serverAddress,
  });
  if (result.error) {
    error('updateMatchServer', result.error);
  }
  return result;
}

export async function fixMissingMatchPlayers(match: MatchesJoined) {
  const keyHashes = mapToKeyhashes(match.rounds);
  const orphanKeys = keyHashes.filter(hasNotKeyhash(match));
  const orphanPlayers = match.players.filter(
    (p) => !(p.keyhash && keyHashes.includes(p.keyhash))
  );

  if (orphanPlayers.length === 1 && orphanKeys.length === 1) {
    const player = orphanPlayers[0];
    await client().updatePlayer(player.id, { keyhash: orphanKeys[0] });

    const { data } = await client().getMatch(match.id);
    logMessage(`Match ${match.id}: Fixed missing player`, {
      player,
      keyhash: orphanKeys[0],
      match: data,
    });

    return data;
  }
  return null;
}

export function toLiveMatch(match: Match): LiveMatch {
  return {
    liveInfo: match.liveInfo,
    liveState: match.state,
    matchId: match.match.id,
    players: match.match.players,
    server: match.matchServer,
  };
}
