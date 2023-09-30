import {
  logChangeMatchStatus,
  logErrorMessage,
  logMessage,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import {
  isNotNull,
  isServerMatch,
  LiveRound,
  MatchesJoined,
  MatchStatus,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { LiveMatch } from './LiveMatch';
import moment from 'moment/moment';
import {
  calculateMatchResults,
  calculatePlayerResults,
  withRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import { updatePlayerRatings } from './players';
import { getMatchResultsEmbed, sendChannelMessage } from '@bf2-matchmaking/discord';
import { toKeyhashList } from '@bf2-matchmaking/utils/src/round-utils';

export const finishMatch = async (match: MatchesJoined, liveRound: LiveRound | null) => {
  logChangeMatchStatus(MatchStatus.Finished, match, liveRound);
  const { data: updatedMatch, error } = await client().updateMatch(match.id, {
    status: MatchStatus.Finished,
  });
  if (error) {
    logSupabaseError('Failed to finish match', error);
    return;
  }

  if (updatedMatch.rounds.length === 0) {
    await client().updateMatch(updatedMatch.id, {
      status: MatchStatus.Closed,
      closed_at: moment().toISOString(),
    });
    logMessage(
      `Match ${updatedMatch.id} has no rounds, closing match without creating results.`,
      {
        match: updatedMatch,
      }
    );
    return;
  }

  try {
    await closeMatch(updatedMatch);
  } catch (e) {
    logErrorMessage('Failed to close match', e);
  }
};
export const closeMatch = async (match: MatchesJoined) => {
  const errors = validateMatch(match);
  if (errors.length > 0) {
    logMessage(`Match ${match.id} is not valid, no results created.`, {
      match,
      errors,
    });
    return errors;
  }

  await processResults(match);

  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Closed,
      closed_at: moment().toISOString(),
    })
    .then(verifySingleResult);
  logChangeMatchStatus(MatchStatus.Closed, match);
  return errors;
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
  const winner = resultsA.is_winner ? resultsA.team : resultsB.team;
  const data = await client().createMatchResult(resultsA, resultsB).then(verifyResult);

  const playerResults = calculatePlayerResults(match).map(
    withRatingIncrement(match, winner)
  );

  await client()
    .createMatchPlayerResults(...playerResults)
    .then(verifyResult);

  await updatePlayerRatings(playerResults);
  logMessage(`Match ${match.id} results created`, { match });

  await sendChannelMessage('1046889100369739786', {
    embeds: [getMatchResultsEmbed(match, [data[0], data[1]])],
  });
}

export const deleteMatch = async (liveMatch: LiveMatch, rounds: Array<RoundsRow>) => {
  logChangeMatchStatus(MatchStatus.Closed, liveMatch.match, liveMatch.liveRound);
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    status: MatchStatus.Deleted,
  });
  if (error) {
    logSupabaseError('Failed to delete match', error);
  }
  return data;
};

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
      liveMatch.match = data;
    }
  }
}
