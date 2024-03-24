import { MatchConfigsRow, PlayersRow } from '@bf2-matchmaking/types';
import { TextChannel } from 'discord.js';
import { getTextChannelFromConfig } from '../../discord/discord-utils';
import { getPlayerByTeamspeakId } from '../supabase-service';
import { sendMessage } from '../message-service';

export class PubobotQueue {
  channel: TextChannel;
  queue = new Map<string, PlayersRow>();
  constructor(channel: TextChannel) {
    this.channel = channel;
  }
  async add(id: string) {
    const player = await getPlayerByTeamspeakId(id);
    if (!player) {
      return false;
    }

    const res = sendMessage(this.channel, `!add_player 4v4 <@${player.id}>`);
    if (!res) {
      return false;
    }

    this.queue.set(id, player);
    return true;
  }
  has(id: string) {
    return this.queue.has(id);
  }
  delete(id: string) {
    const player = this.queue.get(id);
    if (!player) {
      return false;
    }

    const res = sendMessage(this.channel, `!remove_player 4v4 <@${player.id}>`);
    if (!res) {
      return false;
    }

    return this.queue.delete(id);
  }
  static async fromConfig(config: MatchConfigsRow) {
    const channel = await getTextChannelFromConfig(config);
    return new PubobotQueue(channel);
  }
}
