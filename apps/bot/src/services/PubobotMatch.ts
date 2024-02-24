import { Embed, Message, TextChannel } from 'discord.js';
import {
  DiscordConfig,
  MatchesJoined,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchStatus,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { assertNumber, assertObj } from '@bf2-matchmaking/utils';
import {
  createMatch,
  createMatchMaps,
  createMatchPlayers,
  buildMatchTeams,
  getMatch,
  updateMatch,
} from './match-service';
import { findMapId } from './supabase-service';
import { DateTime } from 'luxon';
import {
  getUserIds,
  hasEqualMaps,
  hasEqualPlayers,
  hasEqualTeams,
  toMatchPlayer,
} from './utils';
import { getPubobotId } from './PubobotMatchManager';
import { isTextBasedChannel } from '../discord/discord-utils';
import { getPlayersByIdList } from './player-service';
import { logMessage } from '@bf2-matchmaking/logging';

export class PubobotMatch {
  id: number;
  match: MatchesJoined;
  #channel: TextChannel;
  #embed: Embed;
  players: Array<PlayersRow>;
  teams: Array<MatchPlayersInsert>;
  maps: Array<number>;
  synced: boolean = true;

  constructor(id: number, match: MatchesJoined, channel: TextChannel, embed: Embed) {
    this.id = id;
    this.match = match;
    this.#channel = channel;
    this.#embed = embed;
    this.players = match.players;
    this.teams = match.teams;
    this.maps = match.maps.map((m) => m.id);
  }

  getStatus() {
    return this.match.status;
  }
  setEmbed(embed: Embed) {
    this.#embed = embed;
  }
  getEmbed() {
    return this.#embed;
  }
  getChannel() {
    return this.#channel;
  }
  async syncMaps() {
    if (!hasEqualMaps(this.match, this.maps)) {
      return createMatchMaps(this, this.maps);
    }
    return null;
  }
  async syncPlayers() {
    if (
      !hasEqualPlayers(this.match, this.players) ||
      !hasEqualTeams(this.match, this.teams)
    ) {
      return createMatchPlayers(this, this.teams);
    }
    return null;
  }
  async syncMatch(values?: MatchesUpdate) {
    let syncedMaps;
    let syncedMatchPlayers;
    let syncedMatch;
    if (!this.synced) {
      syncedMaps = await this.syncMaps();
      syncedMatchPlayers = await this.syncPlayers();
    }
    if (values) {
      syncedMatch = await updateMatch(this, values);
    } else if (!this.synced) {
      syncedMatch = await getMatch(this.match.id);
    }

    assertObj(syncedMatch, `Failed to sync match ${this.match.id}`);

    this.match = syncedMatch;
    this.players = syncedMatch.players;
    this.teams = syncedMatch.teams;
    this.maps = syncedMatch.maps.map((m) => m.id);
    this.synced = true;

    logMessage(`Match ${this.match.id}: Synced - Status: ${this.match.status}`, {
      values,
      syncedMaps,
      syncedMatchPlayers,
      syncedMatch,
    });

    return syncedMatch;
  }

  async updateDraftingPlayers() {
    const playerIds = [
      ...getUserIds(this.#embed, 'MEC/PLA'),
      ...getUserIds(this.#embed, 'USMC'),
      ...getUserIds(this.#embed, 'Unpicked'),
    ];
    this.players = await getPlayersByIdList(playerIds);
    this.teams = this.players.map(toMatchPlayer(this.match.id));
    this.synced = false;
  }

  async updateMap() {
    const mapName = this.#embed.fields?.find((f) => f.name === 'Map')?.value || null;
    const map = mapName ? await findMapId(mapName) : null;
    if (map) {
      this.maps = [map];
      this.synced = false;
    }
  }
  async startMatch(embed: Embed) {
    const team1 = getUserIds(embed, 'USMC');
    const team2 = getUserIds(embed, 'MEC/PLA');

    const [players, teams] = await buildMatchTeams(
      this.match.id,
      this.match.config.id,
      team1,
      team2
    );

    this.players = players;
    this.teams = teams;
    this.synced = false;

    logMessage(`Match ${this.match.id}: Created teams`, {
      team1,
      team2,
      teams,
      players,
    });

    await this.syncMatch({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
  }
  static async fromCheckInEmbed(config: DiscordConfig, message: Message<true>) {
    if (!isTextBasedChannel(message.channel)) {
      throw new Error('Not a text based channel');
    }
    const embed = message.embeds[0];
    const id = getPubobotId(embed);
    assertNumber(id, 'Failed to get pubobot id from embed');

    const match = await createMatch(config, MatchStatus.Open);
    return new PubobotMatch(id, match, message.channel, embed);
  }
}
