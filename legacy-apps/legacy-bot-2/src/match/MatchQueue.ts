import {
  ConnectedLiveServer,
  DiscordConfig,
  isTeamspeakPlayer,
  LiveServer,
  MatchesJoined,
  MatchStatus,
  PlayersRow,
  TeamspeakPlayer,
} from '@bf2-matchmaking/types';
import { Message, TextChannel } from 'discord.js';
import { getTextChannelFromConfig } from '../discord/discord-utils';
import { getPlayerByTeamspeakId } from '../services/supabase-service';
import { editMessage, sendMessage } from '../services/message-service';
import { info, logErrorMessage, logMessage, warn } from '@bf2-matchmaking/logging';
import { getAvailableServer, getServerPlayers } from '../services/live-service';
import { createMatch, createMatchPlayers, getMatch } from '../services/match-service';
import { buildDraftWithConfig } from '../services/draft-service';
import { toMatchPlayer } from '../services/utils';
import { assertObj, hasEqualElements } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { buildQueueMessage } from './queue-message';

export class MatchQueue {
  config: DiscordConfig;
  channel: TextChannel;
  queue: Array<TeamspeakPlayer> = [];
  queueTimeout: DateTime | null = null;
  #queueMessage: Message<true> | null = null;
  server: ConnectedLiveServer;
  readyPlayers: Array<string> = [];
  #pollInterval: NodeJS.Timeout | null = null;
  #pollTimeout: NodeJS.Timeout | null = null;
  #onMatchStartedCB:
    | ((match: MatchesJoined, matchPlayers: Array<TeamspeakPlayer>) => void)
    | null = null;
  #onQueueResetCB: ((latePlayers: Array<TeamspeakPlayer>) => void) | null = null;
  summoning = false;
  state: 'queue' | 'summon' | 'reset' | 'start' = 'queue';
  match: MatchesJoined | null = null;

  constructor(config: DiscordConfig, channel: TextChannel, server: ConnectedLiveServer) {
    this.config = config;
    this.channel = channel;
    this.server = server;
  }
  async add(id: string) {
    info('MatchQueue', `Adding player ${id} to match queue`);
    if (this.has(id)) {
      warn('MatchQueue', `Player with ${id} already in queue`);
      return false;
    }

    const player = await getPlayerByTeamspeakId(id);
    if (!isTeamspeakPlayer(player)) {
      warn('MatchQueue', `Player with ${id} not found`);
      return false;
    }

    this.queue.push(player);
    info('MatchQueue', `Player ${player.nick} added to match queue`);

    await this.syncQueueMessage(player, 'joined');

    if (this.state === 'queue' && this.queue.length === this.config.size) {
      await this.startReadyCheck();
    }

    return true;
  }
  has(id: string) {
    return this.queue.some((player) => player.teamspeak_id === id);
  }
  async delete(id: string) {
    info('MatchQueue', `Deleting player ${id} from match queue`);
    const player = this.queue.find((player) => player.teamspeak_id === id);
    if (!player) {
      warn('MatchQueue', `Player with ${id} not found`);
      return false;
    }

    this.queue = this.queue.filter((player) => player.teamspeak_id !== id);
    info('MatchQueue', `Player ${player.nick} deleted from match queue`);

    await this.syncQueueMessage(player, 'left');
    return true;
  }
  getPool() {
    return this.queue.slice(0, this.config.size);
  }
  onMatchStarted(
    cb: (match: MatchesJoined, matchPlayers: Array<TeamspeakPlayer>) => void
  ) {
    this.#onMatchStartedCB = cb;
    return this;
  }
  onQueueReset(cb: (latePlayers: Array<TeamspeakPlayer>) => void) {
    this.#onQueueResetCB = cb;
    return this;
  }
  async startReadyCheck() {
    info('MatchQueue', 'Starting ready check');
    this.state = 'summon';
    this.#pollInterval = setInterval(() => this.pollServer(), 5000);
    this.queueTimeout = DateTime.now().plus({ minutes: 10 });
    await this.syncMessage();

    this.#pollTimeout = setTimeout(
      () => this.resetQueue(false),
      this.queueTimeout.diffNow('milliseconds').milliseconds
    );
  }
  async pollServer() {
    info('MatchQueue', `Polling ${this.server.address}...`);
    try {
      const serverPlayers = await getServerPlayers(this.server);
      const readyPlayers = this.getPool()
        .filter((p) => serverPlayers.some((sp) => p.keyhash === sp.keyhash))
        .map((p) => p.id);
      info('MatchQueue', `Ready players: ${readyPlayers.length}`);

      if (hasEqualElements(readyPlayers, this.readyPlayers)) {
        return;
      }
      this.readyPlayers = readyPlayers;
      await this.syncMessage();

      if (this.readyPlayers.length === this.config.size) {
        await this.startMatch();
      }
    } catch (err) {
      logErrorMessage('Failed to poll server', err, { matchQueue: this });
    }
  }
  async resetQueue(isSuccess: boolean) {
    if (this.state === 'queue') {
      return;
    }

    info('MatchQueue', 'Resetting queue');
    if (isSuccess) {
      this.queue = this.queue.filter((p) => !this.readyPlayers.includes(p.id));
      this.readyPlayers = [];
    } else {
      const latePlayers = this.queue
        .slice(0, this.config.size)
        .filter((p) => !this.readyPlayers.includes(p.id));

      this.queue = this.queue.filter((p) => !latePlayers.some((lp) => p.id === lp.id));
      this.readyPlayers = [];

      if (this.#onQueueResetCB) {
        this.#onQueueResetCB(latePlayers);
      }
    }

    this.state = 'queue';
    this.#queueMessage = null;
    this.clearPolling();
    await this.syncQueueMessage();
  }
  async startMatch() {
    info('MatchQueue', 'Starting match');
    this.state = 'start';
    await this.syncMessage();

    const players = this.queue.filter((p) => this.readyPlayers.includes(p.id));

    const match = await createMatch(this.config, MatchStatus.Ongoing);
    const matchPlayers = await buildDraftWithConfig(
      players.map(toMatchPlayer(match.id)),
      this.config
    );
    await createMatchPlayers(matchPlayers);
    const updatedMatch = await getMatch(match.id);
    assertObj(updatedMatch, 'Failed to get updated match');

    this.match = updatedMatch;
    await this.syncMessage();
    await this.resetQueue(true);

    if (this.#onMatchStartedCB) {
      this.#onMatchStartedCB(updatedMatch, players);
    }
  }
  async syncQueueMessage(player?: PlayersRow, action?: 'joined' | 'left') {
    const statusMessage = player && action ? `<@${player.id}> ${action}` : null;
    return this.syncMessage(statusMessage);
  }
  async syncMessage(statusMessage: string | null = null) {
    info('MatchQueue', 'Syncing message');
    if (this.#queueMessage) {
      await editMessage(this.#queueMessage, buildQueueMessage(this, statusMessage));
      return true;
    }

    const message = await sendMessage(
      this.channel,
      buildQueueMessage(this, statusMessage)
    );
    if (message) {
      this.#queueMessage = message;
      return true;
    }

    warn('MatchQueue', 'Message synced failed');
    return false;
  }

  clearPolling() {
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
    }
    if (this.#pollTimeout) {
      clearTimeout(this.#pollTimeout);
    }
  }
  static async fromConfig(config: DiscordConfig) {
    const channel = await getTextChannelFromConfig(config);
    const server = await getAvailableServer();
    const queue = new MatchQueue(config, channel, server);
    logMessage(`Config ${config.name}: Match queue created`, { config, channel, server });
    return queue;
  }
}
