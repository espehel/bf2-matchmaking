import moment, { Moment } from 'moment/moment';
import { info, logRconError } from '@bf2-matchmaking/logging';
import {
  getPlayerList,
  getServerInfo,
  rcon,
  restartRound,
  switchPlayers,
} from './RconManager';
import { LiveMatch } from '../services/LiveMatch';
import { verifyData } from '../mappers/rcon';
import { RconServer, ServerRconsRow } from '@bf2-matchmaking/types';

const IDLE_POLL_INTERVAL = 1000 * 60 * 5;
const LIVE_MATCH_POLL_INTERVAL = 1000 * 10;
const POLL_MAX_DURATION = 1000 * 3600 * 3;

export class LiveServer {
  ip: string;
  port: number;
  password: string;
  #liveMatch: LiveMatch | null = null;
  info: RconServer;
  updatedAt: Moment;
  #interval: NodeJS.Timeout | undefined;
  #timeout: NodeJS.Timeout | undefined;
  #errorAt: Moment | null = null;
  #waitingSince: Moment | null = null;
  constructor(rconInfo: ServerRconsRow, info: RconServer) {
    this.ip = rconInfo.id;
    this.port = rconInfo.rcon_port;
    this.password = rconInfo.rcon_pw;
    this.info = info;
    this.updatedAt = moment();
  }
  start() {
    this.#clearTimers();
    this.#interval = setInterval(this.#updateInfo, IDLE_POLL_INTERVAL);
    return this;
  }
  reset() {
    this.#clearTimers();
    this.#liveMatch = null;
    this.#waitingSince = null;
    this.#interval = setInterval(this.#updateInfo, IDLE_POLL_INTERVAL);
    return this;
  }
  setLiveMatch(liveMatch: LiveMatch) {
    this.#liveMatch = liveMatch;
    this.#clearTimers();
    this.#interval = setInterval(this.#updateInfo, LIVE_MATCH_POLL_INTERVAL);
    this.#timeout = setTimeout(this.#stopPolling, POLL_MAX_DURATION);
    this.#waitingSince = moment();
    return this;
  }
  isIdle() {
    return !Boolean(this.#liveMatch);
  }

  hasLiveMatch(liveMatch: LiveMatch) {
    return this.#liveMatch
      ? Boolean(this.#liveMatch.match.id === liveMatch.match.id)
      : false;
  }

  async #updateInfo() {
    try {
      const si = await this.#rcon().then(getServerInfo);
      const pl =
        si.connectedPlayers !== '0' ? await this.#rcon().then(getPlayerList) : [];
      verifyData(si, pl);
      this.info = { ...si, players: pl, ip: this.ip };
      this.updatedAt = moment();
      if (this.#liveMatch) {
        await this.#updateLiveMatch(this.#liveMatch);
      }
    } catch (e) {
      if (e instanceof Error) {
        logRconError(e.message, e, this.ip);
      } else {
        logRconError(JSON.stringify(e), e, this.ip);
      }
      this.#errorAt = moment();
    }
  }
  async #updateLiveMatch(liveMatch: LiveMatch) {
    const { state, payload } = await liveMatch.onLiveServerUpdate(this);
    info('pollServerInfo', `State: ${state}`);

    if (state !== 'waiting') {
      this.#errorAt = null;
      this.#waitingSince = null;
    }

    if (moment().diff(this.#errorAt, 'minutes') > 30) {
      this.reset();
    }

    if (state === 'prelive') {
      const spRes = await this.#rcon().then(switchPlayers(payload));
      const rsRes = await this.#rcon().then(restartRound);
      info(
        'pollServerInfo',
        `Prelive executed: switch: "${spRes.join(', ')}", rs: "${rsRes}"`
      );
    }

    if (state === 'finished') {
      this.#clearTimers();
    }

    if (state === 'waiting' && moment().diff(this.#waitingSince, 'minutes') > 30) {
      info('pollServerInfo', `Server is idle, stops polling`);
      this.reset();
    }
  }
  #rcon() {
    return rcon(this.ip, this.port, this.password);
  }
  #stopPolling() {
    info('pollServerInfo', `Live match polling timed out.`);
    this.reset();
  }
  #clearTimers() {
    clearInterval(this.#interval);
    clearTimeout(this.#timeout);
  }
}
