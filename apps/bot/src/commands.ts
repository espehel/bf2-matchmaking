import { getCommands, postCommand } from '@bf2-matchmaking/discord';
import { APIApplicationCommand } from 'discord-api-types/v10';
import { error, info } from '@bf2-matchmaking/logging';
import { Message } from 'discord.js';
import { DiscordConfig } from '@bf2-matchmaking/types';
import {
  onCapfor,
  onExpire,
  onHelp,
  onJoin,
  onLeave,
  onPick,
  onSubFor,
  onWho,
} from './message-interactions';

export async function HasGuildCommands(
  appId: string,
  guildId: string,
  commands: Array<Partial<APIApplicationCommand>>
) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(
  appId: string,
  guildId: string,
  command: Partial<APIApplicationCommand>
) {
  const { data, error: err } = await getCommands(appId, guildId);

  if (data) {
    const installedNames = data.map((c) => c.name);
    if (!installedNames.some((c) => c === command.name)) {
      info('HasGuildCommand', `Installing "${command.name}"`);
      await InstallGuildCommand(appId, guildId, command);
    } else {
      info('HasGuildCommand', `"${command.name}" command already installed`);
    }
  }
  if (err) {
    error('HasGuildCommand', err);
  }
}

export async function InstallGuildCommand(
  appId: string,
  guildId: string,
  command: Partial<APIApplicationCommand>
) {
  const { error: err } = await postCommand(appId, guildId, command);
  if (err) {
    error('InstallGuildCommand', err);
  }
}

export const JOIN_COMMAND: Partial<APIApplicationCommand> = {
  name: 'join',
  description: 'Join a match',
  type: 1,
};

export const LEAVE_COMMAND: Partial<APIApplicationCommand> = {
  name: 'leave',
  description: 'Leave a match',
  type: 1,
};

export const INFO_COMMAND: Partial<APIApplicationCommand> = {
  name: 'info',
  description: 'Get info for channels open match.',
  type: 1,
};

export const PICK_COMMAND: Partial<APIApplicationCommand> = {
  name: 'pick',
  description: 'Leave a match',
  type: 1,
  options: [
    {
      name: 'player',
      description: 'User to be picked',
      type: 1,
    },
  ],
};

// ------------------- GATEWAY COMMANDS -------------------------//
export interface BaseCommand {
  name: string;
  command: string;
  action: (msg: Message) => Promise<unknown>;
}

export interface ConfigCommand extends Omit<BaseCommand, 'action'> {
  name: 'join' | 'expire';
  action: (msg: Message, matchConfig: DiscordConfig) => Promise<unknown>;
}

export type GatewayCommand = BaseCommand | ConfigCommand;
export const commands: Array<GatewayCommand> = [
  { name: 'help', command: '!help', action: onHelp },
  { name: 'info', command: '!who', action: onWho },
  { name: 'join', command: '++', action: onJoin },
  { name: 'leave', command: '--', action: onLeave },
  { name: 'pick', command: '!pick', action: onPick },
  { name: 'expire', command: '!expire', action: onExpire },
  { name: 'capfor', command: '!capfor', action: onCapfor },
  { name: 'subfor', command: '!subfor', action: onSubFor },
];

export const isCommand = (message: Message) =>
  commands.some((interaction) => message.content.startsWith(interaction.command));
export const executeCommand = (
  message: Message,
  config: DiscordConfig
): Promise<unknown> => {
  const command = commands.find((interaction) =>
    message.content.startsWith(interaction.command)
  );

  if (command) {
    info('executeCommand', `Executing interaction: ${command.name}`);
    return command.action(message, config);
  }

  return Promise.resolve();
};
