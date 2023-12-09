import { Embed, GuildMemberManager } from 'discord.js';
import { getPubobotId, getUserIds, getUserNames } from './pubobot-serviceV2';
import { isNotNull } from '@bf2-matchmaking/types';

export class PubobotMatch {
  id: number;
  players: Set<string> = new Set();
  map: string | null = null;
  state: 'checkin' | 'drafting' | 'started';
  matchId: number | null = null;

  constructor(id: number, state: 'checkin' | 'drafting' | 'started') {
    this.id = id;
    this.state = state;
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
    this.players = new Set(...this.players, ...members.filter(isNotNull));
  }

  addCheckinPlayers(embed: Embed) {
    this.players = new Set(...this.players, ...getUserIds(embed, 'Waiting on:'));
  }

  setMap(embed: Embed) {
    this.map = embed.fields?.find((f) => f.name === 'Map')?.value || null;
  }
  setMatchId(matchId: number) {
    this.matchId = matchId;
  }
  getPlayers() {
    return Array.from(this.players);
  }
  static fromCheckInEmbed(embed: Embed) {
    const id = getPubobotId(embed);
    if (!id) {
      return null;
    }
    return new PubobotMatch(id, 'checkin');
  }
  static fromDraftingEmbed(embed: Embed) {
    const id = getPubobotId(embed);
    if (!id) {
      return null;
    }
    return new PubobotMatch(id, 'drafting');
  }
}
