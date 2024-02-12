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
  buildMatchPlayers,
  createMatch,
  createMatchMaps,
  createMatchPlayers,
  createMatchTeams,
  getMatch,
  updateMatch,
} from './match-service';
import { findMapId } from './supabase-service';
import { DateTime } from 'luxon';
import { getUserIds, hasEqualMaps, hasEqualPlayers, hasEqualTeams } from './utils';
import { getPubobotId } from './PubobotMatchManager';
import { isTextBasedChannel } from '../discord/discord-utils';
import { getPlayersByIdList } from './player-service';
import { logMessage } from '@bf2-matchmaking/logging';

export class PubobotMatch {
  id: number;
  match: MatchesJoined;
  channel: TextChannel;
  players: Array<PlayersRow>;
  teams: Array<MatchPlayersInsert>;
  maps: Array<number>;
  synced: boolean = true;

  constructor(id: number, match: MatchesJoined, channel: TextChannel) {
    this.id = id;
    this.match = match;
    this.channel = channel;
    this.players = match.players;
    this.teams = match.teams;
    this.maps = match.maps.map((m) => m.id);
  }

  getStatus() {
    return this.match.status;
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

  async addDraftingPlayers(embed: Embed) {
    const playerIds = await Promise.all([
      ...getUserIds(embed, 'MEC/PLA'),
      ...getUserIds(embed, 'USMC'),
      ...getUserIds(embed, 'Unpicked'),
    ]);
    this.players = await getPlayersByIdList(playerIds);
    this.teams = await buildMatchPlayers(this, this.players);
    this.synced = false;
  }

  async setMap(embed: Embed) {
    const mapName = embed.fields?.find((f) => f.name === 'Map')?.value || null;
    const map = mapName ? await findMapId(mapName) : null;
    if (map) {
      this.maps = [map];
      this.synced = false;
    }
  }
  async startMatch(embed: Embed) {
    const team1 = getUserIds(embed, 'USMC');
    const team2 = getUserIds(embed, 'MEC/PLA');

    const [team1Result, team2Result, removedResult] = await createMatchTeams(
      this,
      team1,
      team2
    );
    logMessage(`Match ${this.match.id}: Created teams`, {
      team1,
      team2,
      team1Result,
      team2Result,
      removedResult,
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
    return new PubobotMatch(id, match, message.channel);
  }
}
