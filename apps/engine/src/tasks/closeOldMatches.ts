import matches from '../state/matches';
import moment from 'moment';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { api } from '@bf2-matchmaking/utils';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

export async function closeOldMatches() {
  const oldMatches = matches.getOngoing().filter(isOlderThan2Days);
  info('closeOldMatches', `Handling ${oldMatches.length} old matches`);

  const matchesWithRounds = oldMatches.filter((m) => m.rounds.length > 0);
  if (matchesWithRounds.length) {
    info('closeOldMatches', `Closing ${matchesWithRounds.length} matches with rounds`);
    await Promise.all(matchesWithRounds.map(closeMatch));
  }

  const matchesWithoutRounds = oldMatches.filter((m) => m.rounds.length === 0);
  if (matchesWithoutRounds.length) {
    info('closeOldMatches', `Force closing ${oldMatches.length} matches without rounds.`);
    await Promise.all(matchesWithoutRounds.map(forceCloseMatch));
  }
}

function isOlderThan2Days(match: MatchesJoined) {
  return match.started_at ? moment().diff(match.started_at, 'days') > 2 : true;
}

async function closeMatch(match: MatchesJoined) {
  await client().updateMatch(match.id, {
    status: MatchStatus.Finished,
  });

  const { error } = await api.rcon().postMatchResults(match.id);

  if (error) {
    logErrorMessage(`Match ${match.id} failed to create results, force closing.`, error, {
      match,
    });
    await forceCloseMatch(match);
  } else {
    logMessage(`Match ${match.id} created results.`, { match });
  }
}

async function forceCloseMatch(match: MatchesJoined) {
  const { error } = await client().updateMatch(match.id, {
    status: MatchStatus.Closed,
    closed_at: moment().toISOString(),
  });

  if (error) {
    logErrorMessage(`Match ${match.id} failed to force close`, error, {
      match,
    });
  } else {
    logMessage(`Match ${match.id} force closed`, { match });
  }
}