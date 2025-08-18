import { Message, RateLimitError, ReadonlyCollection, TextChannel } from 'discord.js';
import { error, info, warn } from '@bf2-matchmaking/logging';
import { assertObj, assertString } from '@bf2-matchmaking/utils';
import { getTextChannel } from './services/message-service';
import { Duration } from 'luxon';
import { Job } from '@bf2-matchmaking/scheduler';

interface QueueConfig {
  channelId: string;
  label: string;
  channelName: string;
}

export function initQueueListeners() {
  [
    {
      channelId: '597415520337133571',
      label: '4v4',
      channelName: 'join-4v4-queue',
    },
    {
      channelId: '597428419617095680',
      label: '5v5',
      channelName: 'join-5v5-queue',
    },
    {
      channelId: '1045376644422045706',
      label: '2100',
      channelName: 'join-8v8-queue',
    },
  ].map(ChannelQueueListener.init);
}

class ChannelQueueListener {
  originalName: string;
  channel: TextChannel;
  label: string;
  updateNameJob: Job<string>;

  constructor(channel: TextChannel, label: string, originalName: string) {
    this.channel = channel;
    this.label = label;
    this.originalName = originalName;
    this.updateNameJob = Job.create(
      `${originalName}-queue-update-name`,
      async (input: string) => {
        await this.setName(input);
      }
    );
  }
  async updateCount(current: number, max: number) {
    await this.setName(`${this.originalName}_${current}of${max}`);
  }
  async setName(name: string) {
    if (this.channel.name === name) {
      warn(
        'ChannelQueueListener',
        `Channel ${this.channel.name} already has name ${name}`
      );
      return;
    }
    try {
      this.channel = await this.channel.setName(name);
      info('ChannelQueueListener', `Renamed channel to ${this.channel.name}`);
    } catch (e) {
      if (e instanceof RateLimitError) {
        warn(
          'ChannelQueueListener',
          `Rate limit hit for ${this.channel.name}! Retrying in ${Duration.fromMillis(
            e.retryAfter
          ).toFormat('mm:ss')}`
        );
        this.updateNameJob.schedule({
          input: name,
          singeRun: true,
          interval: `${e.retryAfter}ms`,
        });
      } else {
        error('ChannelQueueListener', e);
      }
    }
  }

  start() {
    const collector = this.channel.createMessageCollector();
    collector.filter = (message) =>
      message.content.startsWith(`> **${this.label}** (`) ||
      message.content.startsWith(`> no players`);
    collector.on('collect', this.handleQueueCollect);
    collector.on('end', this.handleQueueEnd);
    info('ChannelQueueListener', `Listening to queue ${this.label}`);
    return this;
  }

  handleQueueEnd = (
    collected: ReadonlyCollection<string, Message<boolean>>,
    reason: string
  ) => {
    info(
      'addQueueListener',
      `Stopped listening to ${this.label}, after collecting ${collected.size} messages, because ${reason}.`
    );
  };

  handleQueueCollect = async (message: Message) => {
    if (!message.inGuild()) {
      return;
    }
    info('handleQueueCollect', `<${this.channel.name}>: ${message.content}`);

    if (message.content.startsWith(`> no players |`)) {
      info('handleQueueCollect', `Queue ${this.label} has no players, resetting name`);
      await this.setName(this.originalName);
      return;
    }

    const line = message.content
      .split('\n')
      .find((line) => line.startsWith(`> **${this.label}** (`));
    assertString(line, `Queue line not found for ${this.label}`);

    const [current, max] = extractPlayerCount(this.label, line);
    info(
      'handleQueueCollect',
      `Queue ${this.label} has ${current}/${max} players, updating name`
    );
    await this.updateCount(current, max);
  };

  static async init(config: QueueConfig) {
    try {
      const channel = await getTextChannel(config.channelId);
      return new ChannelQueueListener(channel, config.label, config.channelName).start();
    } catch (e) {
      error('ChannelQueueListener.init', e);
      return null;
    }
  }
}

function extractPlayerCount(label: string, input: string): [number, number] {
  const regex = new RegExp(`\\*\\*${label}\\*\\*\\s\\((\\d+)/(\\d+)\\)`);
  const match = input.match(regex);
  assertObj(
    match,
    `Failed to extract player count for mode ${label} from input: ${input}`
  );

  const current = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  if (isNaN(current) || isNaN(max)) {
    throw new Error(`Invalid player count extracted for mode ${label}: ${input}`);
  }

  return [current, max];
}
