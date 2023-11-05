import {
  LiveServerState,
  MatchesJoined,
  LiveInfo,
  RoundsRow,
} from '@bf2-matchmaking/types';
import { insertRound } from './round-service';
import {
  finishMatch,
  hasPlayedAllRounds,
  isFirstTimeFullServer,
  isOngoingRound,
  isServerEmptied,
  sendWarmUpStartedMessage,
  updateLiveAt,
} from './matches';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { formatSecToMin, getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { removeLiveMatch } from './MatchManager';
import { isServerIdentified } from '../net/ServerManager';
import { DateTime } from 'luxon';

export interface LiveMatchOptions {
  prelive: boolean;
}
interface LiveServerBaseUpdate {
  state: Exclude<LiveServerState, 'prelive'>;
  payload: null;
}

interface LiveServerPreliveUpdate {
  state: 'prelive';
  payload: Array<string>;
}

export type LiveServerUpdate = LiveServerBaseUpdate | LiveServerPreliveUpdate;
export class LiveMatch {
  pendingSince: DateTime | null = DateTime.now();
  match: MatchesJoined;
  state: LiveServerState = 'pending';
  rounds: Array<RoundsRow> = [];
  liveInfo: LiveInfo | null = null;
  options: LiveMatchOptions;
  constructor(match: MatchesJoined, options?: LiveMatchOptions) {
    this.match = match;
    this.options = options || { prelive: false };
  }

  setMatch(match: MatchesJoined) {
    this.match = match;
  }

  isPending() {
    return this.state === 'pending';
  }

  isStale() {
    return this.pendingSince !== null && this.pendingSince.diffNow('hours').hours < -3;
  }

  hasValidMatch() {
    return this.match.players.length > 0;
  }
  #updateLiveInfo(liveInfo: LiveInfo) {
    this.liveInfo = {
      ...liveInfo,
      players: liveInfo.players
        .concat(this.liveInfo?.players || [])
        .filter(
          (p, i, self) => self.findIndex((otherP) => otherP.keyhash === p.keyhash) === i
        ),
    };
    info(
      'updateLiveInfo',
      `${formatSecToMin(liveInfo.roundTime)} (${liveInfo.players.length}/${
        this.match.config.size
      }) ${liveInfo.team1_Name} [${liveInfo.team1_tickets} - ${liveInfo.team2_tickets}] ${
        liveInfo.team2_Name
      }`
    );
  }

  async updateState(liveInfo: LiveInfo): Promise<LiveServerUpdate> {
    this.#updateLiveInfo(liveInfo);
    const next = (state: LiveServerState) => this.handleNextState(state, liveInfo);

    if (hasPlayedAllRounds(this.rounds)) {
      return next('finished');
    }

    if (isServerEmptied(this.rounds, liveInfo)) {
      return next('finished');
    }

    if (!isServerIdentified(liveInfo.players.length, this.match.config.size)) {
      return next('pending');
    }

    if (
      this.state === 'pending' &&
      isServerIdentified(liveInfo.players.length, this.match.config.size)
    ) {
      return next('warmup');
    }

    if (this.state === 'endlive') {
      return next('warmup');
    }

    if (
      this.options.prelive &&
      this.state === 'warmup' &&
      isFirstTimeFullServer(this.match, liveInfo, this.rounds)
    ) {
      return next('prelive');
    }

    if (this.state === 'prelive' && liveInfo.roundTime === '0') {
      return next('live');
    }

    if (
      this.state === 'warmup' &&
      Number(liveInfo.connectedPlayers) !== this.match.players.length
    ) {
      return next('warmup');
    }

    if (isOngoingRound(liveInfo)) {
      return next('live');
    }

    const round = await insertRound(this.match, this.liveInfo || liveInfo);
    logAddMatchRound(round, this.match, liveInfo);
    info('onLiveServerUpdate', `Created round ${round.id}`);
    this.rounds.push(round);
    return next('endlive');
  }

  async handleNextState(
    nextState: LiveServerState,
    liveInfo: LiveInfo
  ): Promise<LiveServerUpdate> {
    if (nextState === 'pending' && this.state !== 'pending') {
      this.pendingSince = DateTime.now();
    }
    if (nextState !== 'pending' && this.state === 'pending') {
      this.pendingSince = null;
    }

    if (this.state === 'pending' && nextState === 'warmup') {
      await sendWarmUpStartedMessage(this, liveInfo);
    }

    if (nextState === 'prelive') {
      await updateLiveAt(this);
      return {
        state: nextState,
        payload: getPlayersToSwitch(this.match, liveInfo.players),
      };
    }

    if (nextState === 'finished') {
      await this.finish();
    }

    if (this.state !== nextState) {
      this.#logChangeLiveState(nextState, liveInfo);
      this.state = nextState;
    }
    return { state: nextState, payload: null };
  }

  async finish() {
    await finishMatch(this.match, this.liveInfo);
    removeLiveMatch(this);
  }
  #logChangeLiveState(nextState: LiveServerState, liveInfo: LiveInfo) {
    logChangeLiveState(this.state, nextState, this.match, this.rounds, liveInfo);
  }
}
