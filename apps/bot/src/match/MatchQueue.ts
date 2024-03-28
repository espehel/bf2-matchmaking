import {
  DiscordConfig,
  isTeamspeakPlayer,
  LiveServer,
  MatchesJoined,
  MatchStatus,
  PlayersRow,
  TeamspeakPlayer,
} from '@bf2-matchmaking/types';
import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { getTextChannelFromConfig } from '../discord/discord-utils';
import { getPlayerByTeamspeakId } from '../services/supabase-service';
import { sendMessage } from '../services/message-service';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { getAvailableServer, getServerPlayers } from '../services/live-service';
import { createMatch, createMatchPlayers, getMatch } from '../services/match-service';
import { buildDraftWithConfig } from '../services/draft-service';
import { toMatchPlayer } from '../services/utils';
import { buildTeamspeakMatchStartedEmbed } from '@bf2-matchmaking/discord';
import { assertObj } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';

export class MatchQueue {
  config: DiscordConfig;
  channel: TextChannel;
  queue: Array<TeamspeakPlayer> = [];
  queueTimeout: DateTime | null = null;
  #queueMessage: Message | undefined;
  #readyMessage: Message | undefined;
  server: LiveServer;
  readyPlayers: Array<string> = [];
  #pollInterval: NodeJS.Timeout | null = null;
  #onMatchStartedCB:
    | ((match: MatchesJoined, matchPlayers: Array<TeamspeakPlayer>) => void)
    | null = null;

  constructor(config: DiscordConfig, channel: TextChannel, server: LiveServer) {
    this.config = config;
    this.channel = channel;
    this.server = server;
  }
  async add(id: string) {
    info('MatchQueue', `Adding player ${id} to match queue`);
    if (this.has(id)) {
      return false;
    }

    const player = await getPlayerByTeamspeakId(id);
    if (!isTeamspeakPlayer(player)) {
      return false;
    }

    this.queue.push(player);
    if (this.queue.length === this.config.size) {
      await this.startReadyCheck();
      return true;
    }
    await this.syncQueueMessage(player, 'joined');
    return true;
  }
  has(id: string) {
    return this.queue.some((player) => player.teamspeak_id === id);
  }
  async delete(id: string) {
    info('MatchQueue', `Deleting player ${id} from match queue`);
    const player = this.queue.find((player) => player.teamspeak_id === id);
    if (!player) {
      return false;
    }

    this.queue = this.queue.filter((player) => player.teamspeak_id !== id);
    await this.syncQueueMessage(player, 'left');
    return true;
  }
  onMatchStarted(
    cb: (match: MatchesJoined, matchPlayers: Array<TeamspeakPlayer>) => void
  ) {
    this.#onMatchStartedCB = cb;
    return this;
  }
  async startReadyCheck() {
    info('MatchQueue', 'Starting ready check');
    this.#pollInterval = setInterval(() => this.pollServer(), 5000);
    this.queueTimeout = DateTime.now().plus({ minutes: 5 });
    await this.syncReadyMessage();

    setTimeout(
      () => this.resetQueue(),
      this.queueTimeout.diffNow('milliseconds').milliseconds
    );
  }
  async pollServer() {
    info('MatchQueue', `Polling ${this.server.address}...`);
    try {
      const serverPlayers = await getServerPlayers(this.server);
      const readyPlayers = this.queue
        .slice(0, this.config.size)
        .filter((p) => serverPlayers.some((sp) => p.keyhash === sp.keyhash))
        .map((p) => p.id);
      info('MatchQueue', `Ready players: ${readyPlayers.length}`);

      if (readyPlayers.length === this.readyPlayers.length) {
        return;
      }

      this.readyPlayers = readyPlayers;
      if (this.readyPlayers.length === this.config.size) {
        this.resetQueue();
        await this.startMatch();
      } else {
        await this.syncReadyMessage();
      }
    } catch (err) {
      logErrorMessage('Failed to poll server', err, { matchQueue: this });
    }
  }
  resetQueue() {
    info('MatchQueue', 'Resetting queue');
    // TODO: based on queue ending successfully or not, send message and remove players from queue
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
    }
  }
  async startMatch() {
    info('MatchQueue', 'Starting match');
    const players = this.queue.filter((p) => this.readyPlayers.includes(p.id));
    this.queue = this.queue.filter((p) => !this.readyPlayers.includes(p.id));
    this.readyPlayers = [];

    const match = await createMatch(this.config, MatchStatus.Ongoing);
    const matchPlayers = await buildDraftWithConfig(
      players.map(toMatchPlayer(match.id)),
      this.config
    );
    await createMatchPlayers(matchPlayers);
    const updatedMatch = await getMatch(match.id);
    assertObj(updatedMatch, 'Failed to get updated match');

    await sendMessage(this.channel, {
      embeds: [buildTeamspeakMatchStartedEmbed(updatedMatch)],
    });

    if (this.#onMatchStartedCB) {
      this.#onMatchStartedCB(updatedMatch, players);
    }
  }
  async syncQueueMessage(player: PlayersRow, action: 'joined' | 'left') {
    const content = buildQueueMessageContent(
      this.queue,
      this.config.size,
      player,
      action
    );
    const message = await sendMessage(this.channel, content);
    if (!message) {
      info('MatchQueue', 'Failed to sync queue message');
      return false;
    }

    if (this.#queueMessage) {
      await this.#queueMessage.delete();
    }
    this.#queueMessage = message;
    info('MatchQueue', 'Queue message synced');
    return true;
  }
  async syncReadyMessage() {
    const embed = buildReadyMessageEmbed(this);
    const message = await sendMessage(this.channel, { embeds: [embed] });
    if (!message) {
      info('MatchQueue', 'Failed to sync ready message');
      return false;
    }

    if (this.#readyMessage) {
      await this.#readyMessage.delete();
    }
    this.#readyMessage = message;
    info('MatchQueue', 'Ready message synced');
    return true;
  }
  static async fromConfig(config: DiscordConfig) {
    const channel = await getTextChannelFromConfig(config);
    const server = await getAvailableServer();
    const queue = new MatchQueue(config, channel, server);
    logMessage(`Config ${config.name}: Match queue created`, { config, channel, server });
    return queue;
  }
}

function buildQueueMessageContent(
  players: Array<PlayersRow>,
  size: number,
  player: PlayersRow,
  action: 'joined' | 'left'
) {
  return `> **4v4** (${players.length}/${size})`
    .concat(players.length ? ` | ${players.map((p) => `\`${p.nick}\``).join('/')}` : '')
    .concat(` | <@${player.id}> ${action}`);
}

function buildReadyMessageEmbed(queue: MatchQueue) {
  return new EmbedBuilder()
    .setTitle(`Join ${queue.server.info.serverName}`)
    .setDescription(
      `Check in by joining server in <t:${queue.queueTimeout?.toUnixInteger()}:R>`
    )
    .setFields({
      name: 'Players',
      value: queue.queue
        .slice(0, queue.config.size)
        .map((p) => `${queue.readyPlayers.includes(p.id) ? '✅' : ''} ${p.nick}`)
        .join('\n'),
    })
    .toJSON();
}
