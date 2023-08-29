import {
  isServerMatch,
  LiveServerState,
  PlayerListItem,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { createLiveRound } from './round-service';
import { LiveServerUpdate } from '../net/RconManager';
import {
  closeMatch,
  hasPlayedAllRounds,
  isFirstTimeFullServer,
  isOngoingRound,
  isServerEmptied,
} from './matches';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { getPlayersToSwitch } from '@bf2-matchmaking/utils';
import { removeLiveMatch } from './MatchManager';
import moment from 'moment';

export class LiveMatch {
  rounds: Array<RoundsRow> = [];
  state: LiveServerState = 'waiting';
  match: ServerMatch;
  liveRound: RoundsInsert | null = null;
  nextServer: boolean = false;
  constructor(match: ServerMatch) {
    this.match = match;
  }

  setMatch(match: ServerMatch) {
    this.match = match;
  }
  async #updateLiveRound(si: ServerInfo, pl: Array<PlayerListItem>) {
    this.liveRound = await createLiveRound(this.match, si, pl);
  }

  async onLiveServerUpdate(
    si: ServerInfo,
    pl: Array<PlayerListItem>,
    ip: string
  ): Promise<LiveServerUpdate> {
    await this.#updateLiveRound(si, pl);

    if (this.nextServer && ip !== this.match.server.ip) {
      this.nextServer = false;
      return this.next('new_server');
    }

    if (this.nextServer) {
      return { state: 'waiting', payload: null };
    }

    if (this.state === 'new_server' && ip === this.match.server.ip) {
      return this.next('waiting');
    }

    if (hasPlayedAllRounds(this.rounds)) {
      return this.next('finished');
    }

    if (isServerEmptied(this.rounds, si)) {
      return this.next('finished');
    }

    if (pl.length === 0) {
      return this.next('waiting');
    }

    if (this.state === 'waiting' || this.state === 'endlive') {
      return this.next('warmup');
    }

    if (this.state === 'warmup' && isFirstTimeFullServer(this.match, si, this.rounds)) {
      return this.next('prelive');
    }

    if (this.state === 'prelive' && si.roundTime === '0') {
      return this.next('live');
    }

    if (isOngoingRound(si)) {
      return this.next('live');
    }

    if (this.liveRound) {
      const round = await client().createRound(this.liveRound).then(verifySingleResult);
      logAddMatchRound(round, this.match, si, pl);
      info('onServerInfo', `Created round ${round.id}`);
      this.rounds.push(round);
    }
    return this.next('endlive');
  }

  async next(
    nextState: LiveServerState,
    pl?: Array<PlayerListItem>,
    si?: ServerInfo
  ): Promise<LiveServerUpdate> {
    if (this.state !== nextState) {
      this.#logChangeLiveState(nextState, si, pl);
      this.state = nextState;
    }

    if (nextState === 'prelive') {
      if (!this.match.live_at) {
        const { data } = await client().updateMatch(this.match.id, {
          live_at: moment().toISOString(),
        });
        if (data && isServerMatch(data)) {
          this.match = data;
        }
      }
      return { state: nextState, payload: pl ? getPlayersToSwitch(this.match, pl) : [] };
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
