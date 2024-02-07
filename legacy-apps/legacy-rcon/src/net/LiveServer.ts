import { error, info } from 'packages/logging';
import {
  getPlayerList,
  getServerInfo,
  rcon,
  restartRound,
  switchPlayers,
} from './RconManager';
import { LiveMatch } from '../services/LiveMatch';
import {
  LiveInfo,
  PlayerListItem,
  ServerInfo,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';

export class LiveServer {
  ip: string;
  port: number;
  #password: string;
  #liveMatch: LiveMatch | null = null;
  info: LiveInfo;
  updatedAt: DateTime = DateTime.now();
  errorAt: DateTime | null = null;
  #waitingSince: DateTime | null = null;
  constructor(rconInfo: ServerRconsRow, info: LiveInfo) {
    this.ip = rconInfo.id;
    this.port = rconInfo.rcon_port;
    this.#password = rconInfo.rcon_pw;
    this.info = info;
  }
  reset() {
    info('LiveServer', `Resetting ${this.ip}`);
    this.#liveMatch = null;
    this.#waitingSince = null;
    this.errorAt = null;
    return this;
  }
  setLiveMatch(liveMatch: LiveMatch) {
    info('LiveServer', `Setting match ${liveMatch.match.id} for ${this.ip}`);
    this.#liveMatch = liveMatch;
    this.#waitingSince = DateTime.now();
    return this;
  }
  getLiveMatch() {
    return this.#liveMatch;
  }
  isIdle() {
    return !Boolean(this.#liveMatch);
  }

  hasLiveMatch(liveMatch: LiveMatch) {
    return this.#liveMatch
      ? Boolean(this.#liveMatch.match.id === liveMatch.match.id)
      : false;
  }

  async update() {
    try {
      if (this.errorAt && this.errorAt.diffNow('minutes').minutes < -30) {
        this.reset();
      }

      const si = await this.#rcon().then(getServerInfo);
      const pl =
        si.connectedPlayers !== '0' ? await this.#rcon().then(getPlayerList) : [];
      verifyData(si, pl);

      this.info = { ...si, players: pl, ip: this.ip };
      this.updatedAt = DateTime.now();
      this.errorAt = null;

      if (this.#liveMatch) {
        await this.#updateLiveMatch(this.#liveMatch);
      }

      return this;
    } catch (e) {
      error('LiveServer', e);
      this.errorAt = DateTime.now();
      return this;
    }
  }
  async #updateLiveMatch(liveMatch: LiveMatch) {
    const { state, payload } = await liveMatch.updateState(this.info);

    if (state !== 'pending') {
      this.#waitingSince = null;
    }

    if (state === 'prelive') {
      const spRes = await this.#rcon().then(switchPlayers(payload));
      const rsRes = await this.#rcon().then(restartRound);
      info(
        'LiveServer',
        `Prelive executed: switch: "${spRes.join(', ')}", rs: "${rsRes}"`
      );
    }

    if (
      state === 'pending' &&
      this.#waitingSince &&
      this.#waitingSince.diffNow('minutes').minutes < -30
    ) {
      info('LiveServer', `No players connected, resetting ${this.ip}`);
      this.reset();
    }

    if (state === 'finished') {
      this.reset();
    }
  }
  #rcon() {
    return rcon(this.ip, this.port, this.#password);
  }
}

export function verifyData(si: ServerInfo, pl: Array<PlayerListItem>) {
  if (Number(si.connectedPlayers) !== pl.length) {
    throw new Error(
      `Corrupt live info. Connected players: ${si.connectedPlayers}, players: ${pl.length}`
    );
  }
}
