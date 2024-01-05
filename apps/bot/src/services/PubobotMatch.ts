import { Embed, GuildMemberManager } from 'discord.js';
import {
  DiscordConfig,
  isNotNull,
  MatchesJoined,
  MatchesUpdate,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { assertNumber } from '@bf2-matchmaking/utils';
import {
  createMatch,
  createMatchMap,
  createMatchPlayers,
  createMatchTeams,
  updateMatch,
} from './match-service';
import { findMapId } from './supabase-service';
import { DateTime } from 'luxon';
import { getUserIds, getUserNames } from './utils';
import { getPubobotId } from './PubobotMatchManager';

export class PubobotMatch {
  id: number;
  match: MatchesJoined;

  constructor(id: number, match: MatchesJoined) {
    this.id = id;
    this.match = match;
  }

  getStatus() {
    return this.match.status;
  }
  async updateMatch(values: MatchesUpdate) {
    this.match = await updateMatch(this, values);
  }

  async addDraftingPlayers(embed: Embed, guild: GuildMemberManager) {
    const searchGuild = async (nick: string) => {
      const result = await guild.search({ query: nick });
      return result.at(0)?.id || null;
    };
    const members = await Promise.all(
      [
        getUserNames(embed, 'MEC'),
        getUserNames(embed, 'USMC'),
        getUserNames(embed, 'Unpicked'),
      ]
        .flat()
        .map(searchGuild)
    );
    this.match = await createMatchPlayers(this, members.filter(isNotNull));
  }

  async addCheckinPlayers(embed: Embed) {
    const players = getUserIds(embed, 'Waiting on:');
    this.match = await createMatchPlayers(this, players);
  }
  async setMap(embed: Embed) {
    const mapName = embed.fields?.find((f) => f.name === 'Map')?.value || null;
    const map = mapName ? await findMapId(mapName) : null;
    if (map) {
      this.match = await createMatchMap(this, map);
    }
  }
  async startMatch(embed: Embed) {
    const team1 = getUserIds(embed, 'USMC');
    const team2 = getUserIds(embed, 'MEC');

    await createMatchTeams(this, team1, team2);
    await this.updateMatch({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
  }
  static async fromCheckInEmbed(config: DiscordConfig, embed: Embed) {
    const id = getPubobotId(embed);
    assertNumber(id, 'Failed to get pubobot id from embed');

    const match = await createMatch(config, MatchStatus.Summoning);
    const pubMatch = new PubobotMatch(id, match);

    await pubMatch.addCheckinPlayers(embed);
    await pubMatch.setMap(embed);

    return pubMatch;
  }
  static async fromDraftingEmbed(
    config: DiscordConfig,
    guild: GuildMemberManager,
    embed: Embed
  ) {
    const id = getPubobotId(embed);
    assertNumber(id, 'Failed to get pubobot id from embed');

    const match = await createMatch(config, MatchStatus.Drafting);
    const pubMatch = new PubobotMatch(id, match);

    await pubMatch.addDraftingPlayers(embed, guild);
    await pubMatch.setMap(embed);

    return pubMatch;
  }
}
