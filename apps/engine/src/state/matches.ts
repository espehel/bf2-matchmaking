import {
  isScheduledMatch,
  MatchesJoined,
  MatchStatus,
  ScheduledMatch,
} from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';

let active: Array<MatchesJoined> = [];
let scheduled: Array<ScheduledMatch> = [];
let matches: Array<MatchesJoined> = [];

export default {
  loadMatches() {
    return client()
      .getMatchesWithStatus(
        MatchStatus.Scheduled,
        MatchStatus.Summoning,
        MatchStatus.Drafting,
        MatchStatus.Ongoing,
        MatchStatus.Finished
      )
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          matches = data;
          info('loadMatches', `Loaded ${matches.length} matches`);
        } else {
          info('loadMatches', 'No matches found');
        }
        if (error) {
          logErrorMessage('Failed to load matches', error);
        }
      });
  },
  get(status: MatchStatus) {
    return matches.filter((m) => m.status === status);
  },
  getStarted() {
    return matches.filter(isStarted);
  },
  getScheduled() {
    return matches.filter(isScheduledMatch);
  },
  putMatch(match: MatchesJoined) {
    if (matches.some(isMatch(match))) {
      info('state/matches', `Updating match ${match.id} with status ${match.status}`);
      matches = matches.map((other) => (isMatch(match)(other) ? match : other));
    } else {
      info(
        'state/matches',
        `Adding match ${match.id} to matches with status ${match.status}`
      );
      matches = [...matches, match];
    }
  },
  removeMatch(match: MatchesJoined) {
    if (matches.some(isMatch(match))) {
      info('state/matches', `Removing match ${match.id} with status ${match.status}`);
      matches = matches.filter(isMatch(match));
    } else {
      info('state/matches', `Match ${match.id} not found`);
    }
  },
};

function isStarted(match: MatchesJoined) {
  return (
    match.status === MatchStatus.Drafting ||
    match.status === MatchStatus.Ongoing ||
    match.status === MatchStatus.Finished
  );
}

function isMatch(match: MatchesJoined) {
  return (other: MatchesJoined) => other.id === match.id;
}
