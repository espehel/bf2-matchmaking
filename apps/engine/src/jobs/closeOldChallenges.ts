import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { Challenge } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import { error, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { finishMatch } from '@bf2-matchmaking/services/matches';
import { createJob } from '@bf2-matchmaking/scheduler';

async function closeOldChallenges() {
  try {
    const challenges = await client().getChallenges().then(verifySingleResult);
    await Promise.all(challenges.filter(isExpiring).map(expireChallenge));
  } catch (e) {
    logErrorMessage('Failed to close old challenges', e);
  }
}

function isExpiring(challenge: Challenge) {
  if (!(challenge.status === 'open' || challenge.status === 'pending')) {
    return false;
  }
  return (
    DateTime.fromISO(challenge.scheduled_at).diffNow('milliseconds').milliseconds < 0
  );
}

async function expireChallenge(challenge: Challenge) {
  const { error } = await client().updateChallenge(challenge.id, { status: 'expired' });
  if (error) {
    logErrorMessage(`Challenge ${challenge.id} failed to expire`, error, { challenge });
    return;
  }
  logMessage(`Challenge ${challenge.id} expired.`, { challenge });
  if (challenge.match) {
    await finishMatch(challenge.match);
  }
}

export function scheduleCloseOldChallengesJob() {
  createJob('closeOldChallenges', closeOldChallenges)
    .on('failed', (name, err) => error(name, err))
    .schedule({ cron: '5 0 * * *' });
}
