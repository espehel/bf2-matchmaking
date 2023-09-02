import {
  LiveRound,
  LiveServerState,
  PlayerListItem,
  RoundsJoined,
  RoundsRow,
  ServerInfo,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { createLiveRound, insertRound } from './round-service';
import { LiveServerUpdate } from '../net/RconManager';
import {
  closeMatch,
  hasPlayedAllRounds,
  isFirstTimeFullServer,
  isOngoingRound,
  isServerEmptied,
  updateLiveAt,
} from './matches';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { formatSecToMin, getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { removeLiveMatch } from './MatchManager';

export class LiveMatch {
  rounds: Array<RoundsRow> = [];
  state: LiveServerState = 'waiting';
  match: ServerMatch;
  liveRound: LiveRound | null = null;
  nextServer: boolean = false;
  constructor(match: ServerMatch) {
    this.match = match;
  }

  setMatch(match: ServerMatch) {
    this.match = match;
  }
  #updateLiveRound(si: ServerInfo, pl: Array<PlayerListItem>) {
    this.liveRound = createLiveRound(this, si, pl);
    info(
      'updateLiveRound',
      `${formatSecToMin(si.roundTime)} (${this.liveRound.pl.length}/${
        this.match.config.size
      }) ${si.team1_Name} [${si.team1_tickets} - ${si.team2_tickets}] ${si.team2_Name}`
    );
  }

  async onLiveServerUpdate(
    si: ServerInfo,
    pl: Array<PlayerListItem>,
    ip: string
  ): Promise<LiveServerUpdate> {
    this.#updateLiveRound(si, pl);
    const next = (state: LiveServerState) => this.handleNextState(state, pl, si);

    if (this.nextServer && ip !== this.match.server.ip) {
      this.nextServer = false;
      return next('new_server');
    }

    if (this.nextServer) {
      return { state: 'waiting', payload: null };
    }

    if (this.state === 'new_server' && ip === this.match.server.ip) {
      return next('waiting');
    }

    if (hasPlayedAllRounds(this.rounds)) {
      return next('finished');
    }

    if (isServerEmptied(this.rounds, si)) {
      return next('finished');
    }

    if (pl.length === 0) {
      return next('waiting');
    }

    if (this.state === 'waiting' || this.state === 'endlive') {
      return next('warmup');
    }

    if (this.state === 'warmup' && isFirstTimeFullServer(this.match, si, this.rounds)) {
      return next('prelive');
    }

    if (this.state === 'prelive' && si.roundTime === '0') {
      return next('live');
    }

    if (isOngoingRound(si)) {
      return next('live');
    }

    if (this.liveRound) {
      const round = await insertRound(this.liveRound);
      logAddMatchRound(round, this.match, si, pl);
      info('onServerInfo', `Created round ${round.id}`);
      this.rounds.push(round);
    }
    return next('endlive');
  }

  async handleNextState(
    nextState: LiveServerState,
    pl: Array<PlayerListItem>,
    si: ServerInfo
  ): Promise<LiveServerUpdate> {
    if (this.state !== nextState) {
      this.#logChangeLiveState(nextState, si, pl);
      this.state = nextState;
    }

    if (nextState === 'prelive') {
      await updateLiveAt(this);
      return { state: nextState, payload: getPlayersToSwitch(this.match, pl) };
    }

    if (nextState === 'finished') {
      await closeMatch(this, `New live state ${nextState}`, this.rounds);
      removeLiveMatch(this);
    }

    return { state: nextState, payload: null };
  }
  #logChangeLiveState(
    nextState: LiveServerState,
    si?: ServerInfo,
    pl?: Array<PlayerListItem>
  ) {
    logChangeLiveState(
      this.state,
      nextState,
      this.match,
      this.rounds,
      this.liveRound,
      si,
      pl
    );
  }
}
