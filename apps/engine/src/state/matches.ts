import {
  isScheduledMatch,
  MatchesJoined,
  MatchStatus,
  ScheduledMatch,
} from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';

let ongoing: Array<MatchesJoined> = [];
let scheduled: Array<ScheduledMatch> = [];

export default {
  loadOngoing() {
    client()
      .getMatchesWithStatus(MatchStatus.Ongoing)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          ongoing = data;
          info('loadOngoing', `Loaded ${ongoing.length} ongoing matches`);
        } else {
          info('loadOngoing', 'No ongoing matches found');
        }
        if (error) {
          logErrorMessage('Failed to load ongoing matches', error);
        }
      });
    return this;
  },
  loadScheduled() {
    client()
      .getMatchesWithStatus(MatchStatus.Scheduled)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          scheduled = data.filter(isScheduledMatch);
          const missingDate = data.length - scheduled.length;
          info(
            'loadScheduled',
            `Loaded ${scheduled.length} scheduled matches. ${missingDate} is missing dates.`
          );
        } else {
          info('loadScheduled', 'No scheduled matches found');
        }
        if (error) {
          logErrorMessage('Failed to load scheduled matches', error);
        }
      });
    return this;
  },
  getOngoing() {
    return [...ongoing];
  },
  getScheduled() {
    return [...scheduled];
  },
  pushMatch(match: MatchesJoined) {
    if (isScheduledMatch(match) && !this.hasScheduledMatch(match)) {
      info('state/matches', `Pushing match ${match.id} to scheduled matches`);
      scheduled.push(match);
    } else if (match.status === MatchStatus.Ongoing && !this.hasOngoingMatch(match)) {
      info('state/matches', `Pushing match ${match.id} to ongoing matches`);
      ongoing.push(match);
    } else {
      info('state/matches', `Discarding match ${match.id}`);
    }
  },
  updateMatch(match: MatchesJoined) {
    this.removeMatch(match);
    this.pushMatch(match);
  },
  hasOngoingMatch(match: MatchesJoined) {
    return ongoing.some((m) => m.id === match.id);
  },
  hasScheduledMatch(match: MatchesJoined) {
    return scheduled.some((m) => m.id === match.id);
  },
  removeMatch(match: MatchesJoined) {
    if (this.hasOngoingMatch(match)) {
      info('state/matches', `Removing match ${match.id} from ongoing matches`);
      ongoing = ongoing.filter((m) => m.id !== match.id);
    }
    if (this.hasScheduledMatch(match)) {
      info('state/matches', `Removing match ${match.id} from scheduled matches`);
      scheduled = scheduled.filter((m) => m.id !== match.id);
    }
  },
};
