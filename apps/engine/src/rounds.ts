import { info, warn } from '@bf2-matchmaking/logging';
import { MatchesRow, MatchStatus, RoundsRow } from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';

export const handleInsertedRound = async (round: RoundsRow) => {
  info('handleInsertedRound', `New round ${round.id}`);
  const matches = await client()
    .getOngoingMatchesByServer(round.server)
    .then(verifyResult);
  if (matches.length === 0) {
    info('handleInsertedRound', `No ongoing match found for round ${round.id}`);
  }
  if (matches.length > 1) {
    warn('handleInsertedRound', `Multiple ongoing matches found for round ${round.id}`);
  }
  const [match] = matches;
  if (match && match.server && match.started_at) {
    const rounds = await client()
      .getServerRoundsByTimestampRange(
        match.server,
        match.started_at,
        new Date().toISOString()
      )
      .then(verifyResult);
    if (rounds.length >= 4) {
      info('handleInsertedRound', `Setting match ${match.id} status to "Closed".`);
      await setMatchStatusClosed(match);
    }
  }
};

const setMatchStatusClosed = async (match: MatchesRow) => {
  client()
    .updateMatch(match.id, {
      status: MatchStatus.Closed,
      closed_at: new Date().toISOString(),
    })
    .then(verifySingleResult);
};
