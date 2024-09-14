import { isNotNull, PollEmoji, PollResult } from '@bf2-matchmaking/types';
import {
  Collection,
  Message,
  MessageCreateOptions,
  MessageEditOptions,
  MessagePayload,
  MessageReaction,
  ReactionCollector,
  TextChannel,
  User,
} from 'discord.js';
import { sendMessage } from '../services/message-service';
import { assertObj } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { compareMessageReactionResults } from './message-polls';
import { info } from '@bf2-matchmaking/logging';

export class MessagePoll {
  message: Message<true>;
  validUsers: Set<string> | null = null;
  reactions: Set<PollEmoji> = new Set([PollEmoji.ACCEPT, PollEmoji.REJECT]);
  endTime: DateTime = DateTime.now().plus({ minutes: 2 });
  collector: ReactionCollector | null = null;
  collectListener: (reaction: MessageReaction, user: User) => void = () => null;
  endListener: (collected: Collection<string, MessageReaction>, reason: string) => void =
    () => null;

  constructor(message: Message<true>) {
    this.message = message;
  }
  static async createPoll(
    channel: TextChannel,
    content: string | MessagePayload | MessageCreateOptions
  ) {
    const message = await sendMessage(channel, content);
    assertObj(message, 'Failed to create poll message');
    return new MessagePoll(message);
  }

  setValidUsers(users: Set<string>) {
    this.validUsers = users;
    return this;
  }
  setReactions(reactions: Set<PollEmoji>) {
    this.reactions = reactions;
    return this;
  }
  getReactions() {
    return Array.from(this.reactions);
  }
  setEndtime(endtime: DateTime) {
    this.endTime = endtime;
    return this;
  }
  #getReactionFilter(reaction: MessageReaction, user: User) {
    return this.#isValidReaction(reaction) && this.#isValidUser(user);
  }
  #isValidReaction(reaction: MessageReaction) {
    return this.reactions.has(reaction.emoji.name as PollEmoji);
  }
  #isValidUser(user: User) {
    return this.validUsers ? this.validUsers.has(user.id) : true;
  }

  onReaction(
    cb: (results: Array<PollResult>) => string | MessagePayload | MessageEditOptions
  ) {
    this.collectListener = async (reaction, user) => {
      info('MessagePoll', `User ${user.id} reacted with ${reaction.emoji.name}`);
      const results = this.message.reactions.cache
        .map(this.#toResults.bind(this))
        .filter(isNotNull)
        .sort(compareMessageReactionResults);
      const content = cb(results);
      await this.message.edit(content);
    };
    return this;
  }

  onPollEnd(
    cb: (
      results: Array<PollResult>
    ) => Promise<string | MessagePayload | MessageEditOptions>
  ) {
    this.endListener = async (
      collected: Collection<string, MessageReaction>,
      reason: string
    ) => {
      info(
        'MessagePoll',
        `Poll ended after collecting ${collected.size} reactions with reason "${reason}"`
      );
      const results = collected
        .map(this.#toResults.bind(this))
        .filter(isNotNull)
        .sort(compareMessageReactionResults);
      const content = await cb(results);
      info(
        'MessagePoll',
        `Editing message with new content "${JSON.stringify(content)}"`
      );
      await this.message.edit(content);
    };
    return this;
  }

  async startPoll() {
    this.collector = this.message.createReactionCollector({
      filter: (reaction, user) => this.#getReactionFilter(reaction, user),
      dispose: true,
      time: this.endTime.diffNow().toMillis(),
    });
    await Promise.all(this.getReactions().map((r) => this.message.react(r)));

    this.collector.on('collect', this.collectListener);
    this.collector.on('end', this.endListener);

    return this;
  }
  stopPoll(reason: string) {
    this.collector?.stop(reason);
  }
  #toResults(reaction: MessageReaction): PollResult | null {
    if (reaction.emoji.name && this.#isValidReaction(reaction)) {
      return [
        reaction.emoji.name,
        Array.from(reaction.users.cache.filter(this.#isValidUser.bind(this)).keys()),
      ];
    } else {
      return null;
    }
  }
}
