import {
  LiveRound,
  LiveServerState,
  MatchesJoined,
  RoundsRow,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { createLiveRound, insertRound } from './round-service';
import {
  finishMatch,
  hasPlayedAllRounds,
  isFirstTimeFullServer,
  isOngoingRound,
  isServerEmptied,
  updateLiveAt,
} from './matches';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { formatSecToMin, getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { removeLiveMatch } from './MatchManager';
import { LiveServer } from '../net/LiveServer';
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
  match: MatchesJoined;
  state: LiveServerState = 'waiting';
  rounds: Array<RoundsRow> = [];
  liveRound: LiveRound | null = null;
  options: LiveMatchOptions;
  constructor(match: MatchesJoined, options?: LiveMatchOptions) {
    this.match = match;
    this.options = options || { prelive: false };
  }

  isWaiting() {
    return this.state === 'waiting';
  }

  #updateLiveRound(server: LiveServer) {
    this.liveRound = createLiveRound(this, server);
    const { roundTime, players, team1_Name, team1_tickets, team2_Name, team2_tickets } =
      server.info;
    info(
      'updateLiveRound',
      `${formatSecToMin(roundTime)} (${players.length}/${
        this.match.config.size
      }) ${team1_Name} [${team1_tickets} - ${team2_tickets}] ${team2_Name}`
    );
  }

  async onLiveServerUpdate(server: LiveServer): Promise<LiveServerUpdate> {
    this.#updateLiveRound(server);
    const next = (state: LiveServerState) => this.handleNextState(state, server);

    if (hasPlayedAllRounds(this.rounds)) {
      return next('finished');
    }

    if (isServerEmptied(this.rounds, server.info)) {
      return next('finished');
    }

    if (server.info.players.length === 0) {
      return next('waiting');
    }

    if (this.state === 'waiting' || this.state === 'endlive') {
      return next('warmup');
    }

    if (
      this.options.prelive &&
      this.state === 'warmup' &&
      isFirstTimeFullServer(this.match, server.info, this.rounds)
    ) {
      return next('prelive');
    }

    if (this.state === 'prelive' && server.info.roundTime === '0') {
      return next('live');
    }

    if (
      this.state === 'warmup' &&
      Number(server.info.connectedPlayers) !== this.match.players.length
    ) {
      return next('warmup');
    }

    if (isOngoingRound(server.info)) {
      return next('live');
    }

    if (this.liveRound) {
      const round = await insertRound(this.liveRound);
      logAddMatchRound(round, this.match, server.info);
      info('onServerInfo', `Created round ${round.id}`);
      this.rounds.push(round);
    }
    return next('endlive');
  }

  async handleNextState(
    nextState: LiveServerState,
    server: LiveServer
  ): Promise<LiveServerUpdate> {
    if (this.state !== nextState) {
      this.#logChangeLiveState(nextState, server);
      this.state = nextState;
    }

    if (nextState === 'prelive') {
      await updateLiveAt(this);
      return {
        state: nextState,
        payload: getPlayersToSwitch(this.match, server.info.players),
      };
    }

    if (nextState === 'finished') {
      await this.finish();
    }

    return { state: nextState, payload: null };
  }

  async finish() {
    await finishMatch(this.match, this.liveRound);
    removeLiveMatch(this);
  }
  #logChangeLiveState(nextState: LiveServerState, server: LiveServer) {
    logChangeLiveState(
      this.state,
      nextState,
      this.match,
      this.rounds,
      this.liveRound,
      server.info
    );
  }
}
