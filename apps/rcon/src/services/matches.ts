import {
  logChangeMatchStatus,
  logErrorMessage,
  logMessage,
} from '@bf2-matchmaking/logging';
import {
  isNotNull,
  isServerMatch,
  LiveInfo,
  MatchesJoined,
  MatchStatus,
  RoundsInsert,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { LiveMatch } from './LiveMatch';
import moment from 'moment/moment';
import {
  calculateMatchResults,
  calculatePlayerResults,
  withMixRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import { updatePlayerRatings } from './players';
import { getMatchResultsEmbed, sendChannelMessage } from '@bf2-matchmaking/discord';
import { toKeyhashList } from '@bf2-matchmaking/utils/src/round-utils';

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
          closed_at: moment().toISOString(),
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
  const errors = validateMatch(match);
  if (errors.length > 0) {
    logMessage(`Match ${match.id} is not valid, no results created.`, {
      match,
      errors,
    });
    return { result: null, errors };
  }

  const results = await processResults(match);

  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Closed,
      closed_at: moment().toISOString(),
    })
    .then(verifySingleResult);
  logChangeMatchStatus(MatchStatus.Closed, match);
  return { results, errors: null };
};

function validateMatch(match: MatchesJoined): Array<string> {
  const errors: Array<string> = [];
  if (!(match.rounds.length === 2 || match.rounds.length === 4)) {
    errors.push('Match must have 2 or 4 rounds');
  }
  if (!validateMatchPlayers(match)) {
    errors.push('Every player must have a keyhash included in the match');
  }
  return errors;
}

function validateMatchPlayers(match: MatchesJoined) {
  const playerKeys = match.rounds.map(toKeyhashList).filter(isNotNull).flat();

  return match.players.every(
    (player) => player.keyhash && playerKeys.includes(player.keyhash)
  );
}

export async function processResults(match: MatchesJoined) {
  const [resultsA, resultsB] = calculateMatchResults(match);
  const winnerId = resultsA.is_winner
    ? resultsA.team
    : resultsB.is_winner
    ? resultsB.team
    : null;
  const data = await client().createMatchResult(resultsA, resultsB).then(verifyResult);

  let playerResults = calculatePlayerResults(match);

  if (match.config.type === 'Mix') {
    playerResults = playerResults.map(withMixRatingIncrement(match, winnerId));
  }

  await client()
    .createMatchPlayerResults(...playerResults)
    .then(verifyResult);

  const updatedRatings = await updatePlayerRatings(playerResults, match.config.id);
  logMessage(`Match ${match.id} results created`, {
    match,
    resultsA,
    resultsB,
    playerResults,
    updatedRatings,
  });

  await sendChannelMessage('1046889100369739786', {
    embeds: [getMatchResultsEmbed(match, [data[0], data[1]])],
  });
  return data;
}

export const hasPlayedAllRounds = (rounds: Array<RoundsInsert>) => rounds.length >= 4;

export const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  rounds: Array<RoundsInsert>
) => Number(si.connectedPlayers) === match.players.length && rounds.length === 0;

export const isOngoingRound = (si: ServerInfo) => {
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

export async function updateLiveAt(liveMatch: LiveMatch) {
  if (!liveMatch.match.live_at) {
    const { data } = await client().updateMatch(liveMatch.match.id, {
      live_at: moment().toISOString(),
    });
    if (data && isServerMatch(data)) {
      liveMatch.setMatch(data);
    }
  }
}

export async function sendWarmUpStartedMessage(liveMatch: LiveMatch, liveInfo: LiveInfo) {
  const match = await updateServer(liveMatch, liveInfo.ip);
  if (match) {
    logMessage(
      `Match ${match.id} warmup started on server ${match.server?.ip};${match.server?.port}`,
      { match, liveMatch, liveInfo }
    );
  }
}

export async function updateServer(liveMatch: LiveMatch, server: string) {
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    server,
  });

  if (error) {
    logErrorMessage(
      `Match ${liveMatch.match.id}: Failed to update server for LiveMatch`,
      error
    );
    return null;
  }

  liveMatch.setMatch(data);
  return data;
}
