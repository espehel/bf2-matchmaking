import moment, { Moment } from 'moment/moment';
import { error, info } from '@bf2-matchmaking/logging';
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

export class LiveServer {
  ip: string;
  port: number;
  #password: string;
  #liveMatch: LiveMatch | null = null;
  info: LiveInfo;
  updatedAt: Moment;
  #errorAt: Moment | null = null;
  #waitingSince: Moment | null = null;
  constructor(rconInfo: ServerRconsRow, info: LiveInfo) {
    this.ip = rconInfo.id;
    this.port = rconInfo.rcon_port;
    this.#password = rconInfo.rcon_pw;
    this.info = info;
    this.updatedAt = moment();
  }
  reset() {
    info('LiveServer', `Resetting ${this.info.serverName}`);
    this.#liveMatch = null;
    this.#waitingSince = null;
    this.#errorAt = null;
    return this;
  }
  setLiveMatch(liveMatch: LiveMatch) {
    info('LiveServer', `Setting match ${liveMatch.match.id} for ${this.info.serverName}`);
    this.#liveMatch = liveMatch;
    this.#waitingSince = moment();
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

  async updateInfo() {
    try {
      if (moment().diff(this.#errorAt, 'minutes') > 30) {
        this.reset();
      }

      const si = await this.#rcon().then(getServerInfo);
      const pl =
        si.connectedPlayers !== '0' ? await this.#rcon().then(getPlayerList) : [];
      verifyData(si, pl);
      this.info = { ...si, players: pl, ip: this.ip };
      this.updatedAt = moment();
      if (this.#liveMatch) {
        await this.#updateLiveMatch(this.#liveMatch);
      }
      return this.info;
    } catch (e) {
      error('LiveServer', e);
      this.#errorAt = moment();
    }
  }
  async #updateLiveMatch(liveMatch: LiveMatch) {
    const { state, payload } = await liveMatch.onLiveServerUpdate(this.info);
    info('LiveServer', `Received live match state: ${state}`);

    if (state !== 'waiting') {
      this.#errorAt = null;
      this.#waitingSince = null;
    }

    if (state === 'prelive') {
      const spRes = await this.#rcon().then(switchPlayers(payload));
      const rsRes = await this.#rcon().then(restartRound);
      info(
        'pollServerInfo',
        `Prelive executed: switch: "${spRes.join(', ')}", rs: "${rsRes}"`
      );
    }

    if (state === 'waiting' && moment().diff(this.#waitingSince, 'minutes') > 30) {
      info('pollServerInfo', `No players connected, resetting ${this.info.serverName}`);
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
