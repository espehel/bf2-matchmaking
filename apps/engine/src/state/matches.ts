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

export default {
  loadActive() {
    client()
      .getMatchesWithStatus(MatchStatus.Ongoing, MatchStatus.Finished)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          active = data;
          info('loadActive', `Loaded ${active.length} active matches`);
        } else {
          info('loadActive', 'No active matches found');
        }
        if (error) {
          logErrorMessage('Failed to load active matches', error);
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
  getActive() {
    return [...active];
  },
  getScheduled() {
    return [...scheduled];
  },
  pushActiveMatch(match: MatchesJoined) {
    if (!this.hasActiveMatch(match)) {
      info('state/matches', `Pushing match ${match.id} to active matches`);
      active.push(match);
    }
  },
  pushScheduledMatch(match: MatchesJoined) {
    if (isScheduledMatch(match) && !this.hasScheduledMatch(match)) {
      info('state/matches', `Pushing match ${match.id} to scheduled matches`);
      scheduled.push(match);
    }
  },
  hasActiveMatch(match: MatchesJoined) {
    return active.some((m) => m.id === match.id);
  },
  hasScheduledMatch(match: MatchesJoined) {
    return scheduled.some((m) => m.id === match.id);
  },
  removeActiveMatch(match: MatchesJoined) {
    if (this.hasActiveMatch(match)) {
      info('state/matches', `Removing match ${match.id} from active matches`);
      active = active.filter((m) => m.id !== match.id);
    }
  },
  removeScheduledMatch(match: MatchesJoined) {
    if (this.hasScheduledMatch(match)) {
      info('state/matches', `Removing match ${match.id} from scheduled matches`);
      scheduled = scheduled.filter((m) => m.id !== match.id);
    }
  },
};
