import {
  LiveServerState,
  MatchesJoined,
  LiveInfo,
  RoundsRow,
  MatchServer,
  MatchPlayersRow,
} from '@bf2-matchmaking/types';
import { insertRound } from './round-service';
import {
  finishMatch,
  hasPlayedAllRounds,
  isFirstTimeFullServer,
  isOngoingRound,
  isServerEmptied,
  updateLiveMatchServer,
  setLiveAt,
} from './matches';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { formatSecToMin, getPlayersToSwitch, hasKeyhash } from '@bf2-matchmaking/utils';
import { removeLiveMatch } from './MatchManager';
import { isServerIdentified } from '../net/ServerManager';
import { DateTime } from 'luxon';
import { saveDemosSince } from '@bf2-matchmaking/demo';
import { client } from '@bf2-matchmaking/supabase';

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
  connectedPlayers: Map<string, MatchPlayersRow> = new Map();
  matchServer: MatchServer | null = null;
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
  setServer(server: MatchServer | null) {
    this.matchServer = server;
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
        .filter((player) => !player.getName.includes('STREAM'))
        .filter(
          (p, i, self) => self.findIndex((otherP) => otherP.keyhash === p.keyhash) === i
        ),
    };
    info(
      'LiveMatch',
      `${formatSecToMin(liveInfo.roundTime)} (${liveInfo.team1_Name} ${
        liveInfo.team1_tickets
      } - ${liveInfo.team2_Name} ${liveInfo.team2_tickets}) [${liveInfo.players.length}/${
        this.match.config.size
      } - ${this.state} - ${liveInfo.serverName}]`
    );
  }

  async #updateConnectedPlayers(liveInfo: LiveInfo) {
    for (const bf2Player of liveInfo.players) {
      if (this.connectedPlayers.has(bf2Player.keyhash)) {
        continue;
      }

      const player = this.match.players.find(hasKeyhash(bf2Player.keyhash));
      if (!player) {
        continue;
      }

      const { data: mp } = await client().updateMatchPlayer(this.match.id, player.id, {
        connected_at: DateTime.now().toISO(),
      });
      if (mp) {
        this.connectedPlayers.set(bf2Player.keyhash, mp);
      }
    }
  }

  async updateState(liveInfo: LiveInfo): Promise<LiveServerUpdate> {
    await this.#updateConnectedPlayers(liveInfo);
    this.#updateLiveInfo(liveInfo);
    const next = (state: LiveServerState) => this.handleNextState(state, liveInfo);

    if (hasPlayedAllRounds(this.match.config, this.rounds)) {
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
      Number(liveInfo.players.length) !== this.match.config.size
    ) {
      return next('warmup');
    }

    if (isOngoingRound(liveInfo)) {
      return next('live');
    }

    if (this.state !== 'live') {
      return next(this.state);
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
      await updateLiveMatchServer(this, liveInfo);
    }

    if (nextState === 'prelive') {
      await setLiveAt(this);
      return {
        state: nextState,
        payload: getPlayersToSwitch(this.match, liveInfo.players),
      };
    }

    if (nextState === 'live') {
      await setLiveAt(this);
    }

    if (nextState === 'finished' && this.state !== 'finished') {
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
    if (
      this.rounds.length > 0 &&
      this.matchServer?.server?.demos_path &&
      this.match.started_at
    ) {
      await saveDemosSince(
        this.matchServer.server.ip,
        this.match.started_at,
        this.matchServer.server.demos_path
      );
    }
  }
  #logChangeLiveState(nextState: LiveServerState, liveInfo: LiveInfo) {
    logChangeLiveState(this.state, nextState, this.match, this.rounds, liveInfo);
  }
}
