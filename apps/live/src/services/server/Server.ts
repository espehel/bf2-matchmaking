import { DateTime } from 'luxon';
import { error, info } from '@bf2-matchmaking/logging';
import {
  LiveInfo,
  PlayerListItem,
  ServerInfo,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import { getPlayerList, getServerInfo, rcon } from '../rcon/RconManager';
import { Match } from '../match/Match';
import { createLiveInfo } from './servers';

const STALE_LIMIT_ERROR = 1000 * 30;
const STALE_LIMIT_IDLE = 1000 * 60;

export class Server {
  address: string;
  port: number;
  gamePort: string;
  #password: string;
  #liveMatch: Match | null = null;
  info: LiveInfo;
  #tickedAt: number = Date.now();
  updatedAt: DateTime = DateTime.now();
  errorAt: DateTime | null = null;
  #waitingSince: DateTime | null = null;
  constructor(rconInfo: ServerRconsRow, info: LiveInfo) {
    this.address = rconInfo.id;
    this.port = rconInfo.rcon_port;
    this.#password = rconInfo.rcon_pw;
    this.info = info;
    this.gamePort = '16567';
  }
  static async create(rconInfo: ServerRconsRow) {
    const info = await createLiveInfo(rconInfo);
    return info ? new Server(rconInfo, info) : null;
  }
  reset() {
    info('LiveServer', `Resetting ${this.address}`);
    this.#liveMatch = null;
    this.#waitingSince = null;
    this.errorAt = null;
    return this;
  }
  setLiveMatch(liveMatch: Match) {
    info('LiveServer', `Setting match ${liveMatch.match.id} for ${this.address}`);
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

  getTickDuration() {
    return Date.now() - this.#tickedAt;
  }

  isStale() {
    if (this.errorAt) {
      return this.getTickDuration() > STALE_LIMIT_ERROR;
    }
    return !this.isIdle() || this.getTickDuration() > STALE_LIMIT_IDLE;
  }

  hasLiveMatch(liveMatch: Match) {
    return this.#liveMatch
      ? Boolean(this.#liveMatch.match.id === liveMatch.match.id)
      : false;
  }

  async update(): Promise<Server> {
    this.#tickedAt = Date.now();
    try {
      if (this.errorAt && this.errorAt.diffNow('minutes').minutes < -30) {
        this.reset();
      }

      const si = await this.rcon().then(getServerInfo);
      const pl = si.connectedPlayers !== '0' ? await this.rcon().then(getPlayerList) : [];
      verifyData(si, pl);

      this.info = { ...si, players: pl, ip: this.address };
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
  async #updateLiveMatch(liveMatch: Match) {
    const state = await liveMatch.updateState(this.info);

    if (state !== 'pending') {
      this.#waitingSince = null;
    }

    if (
      state === 'pending' &&
      this.#waitingSince &&
      this.#waitingSince.diffNow('minutes').minutes < -30
    ) {
      info('LiveServer', `No players connected, resetting ${this.address}`);
      this.reset();
    }

    if (state === 'finished') {
      this.reset();
    }
  }
  rcon() {
    return rcon(this.address, this.port, this.#password);
  }
}

export function verifyData(si: ServerInfo, pl: Array<PlayerListItem>) {
  if (Number(si.connectedPlayers) !== pl.length) {
    throw new Error(
      `Corrupt live info. Connected players: ${si.connectedPlayers}, players: ${pl.length}`
    );
  }
}
