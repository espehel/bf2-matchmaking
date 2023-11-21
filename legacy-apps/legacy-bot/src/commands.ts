import {
  deleteCommand,
  deleteGuildCommand,
  getCommands,
  getGuildCommands,
  postCommand,
  postGuildCommand,
} from '@bf2-matchmaking/discord';
import {
  APIApplicationCommand,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10';
import { info, logCommandEvent } from '@bf2-matchmaking/logging';
import { Message } from 'discord.js';
import { DiscordConfig, isDefined } from '@bf2-matchmaking/types';
import {
  onCapfor,
  onExpire,
  onHelp,
  onJoin,
  onLeave,
  onPick,
  onServer,
  onSubFor,
  onWho,
} from './message-interactions';

export enum ApplicationCommandName {
  Register = 'register',
  Servers = 'servers',
}
export const SERVERS_COMMAND: Partial<APIApplicationCommand> = {
  name: ApplicationCommandName.Servers,
  description: 'Get list of registered servers',
  type: 1,
};

export const REGISTER_COMMAND: Partial<APIApplicationCommand> = {
  name: ApplicationCommandName.Register,
  description: 'Register your key hash to be used in rating and match making',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'key',
      description: 'key hash for your bf2 account, 32 characters long',
      type: ApplicationCommandOptionType.String,
      max_length: 32,
      min_length: 32,
    },
    {
      name: 'serverip',
      description:
        'A server you are currently connected to. Use `/servers` to find a valid server',
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'playerid',
      description: 'Your players ID on the server you currently are connected to.',
      type: ApplicationCommandOptionType.String,
    },
  ],
};
const ACTIVE_COMMANDS = new Map<ApplicationCommandName, Partial<APIApplicationCommand>>([
  [ApplicationCommandName.Register, REGISTER_COMMAND],
  [ApplicationCommandName.Servers, SERVERS_COMMAND],
]);
export async function deleteCommands(appId: string, guildId: string | null) {
  if (guildId) {
    info('deleteCommands', `Deleting commands for guild ${guildId}`);
    const { data } = await getGuildCommands(appId, guildId);
    if (data) {
      await Promise.all(data.map((cmd) => deleteGuildCommand(appId, guildId, cmd.id)));
    }
  }
  if (!guildId) {
    info('deleteCommands', 'Deleting application commands');
    const { data } = await getCommands(appId);
    if (data) {
      await Promise.all(data.map((cmd) => deleteCommand(appId, cmd.id)));
    }
  }
}

export async function installCommands(
  appId: string,
  guildId: string | null,
  commands: Array<string>
) {
  if (guildId) {
    info('installCommands', `Installing commands for guild ${guildId}`);
    await Promise.all(
      (commands as Array<ApplicationCommandName>)
        .map((name) => ACTIVE_COMMANDS.get(name))
        .filter(isDefined)
        .map((cmd) => postGuildCommand(appId, guildId, cmd))
    );
  }
  if (!guildId) {
    info('installCommands', 'Installing application commands');
    await Promise.all(
      (commands as Array<ApplicationCommandName>)
        .map((name) => ACTIVE_COMMANDS.get(name))
        .filter(isDefined)
        .map((cmd) => postCommand(appId, cmd))
    );
  }
}

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
  { name: 'server', command: '!server', action: onServer },
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
    logCommandEvent(command.name, message.content, message.author.id, config);
    return command.action(message, config);
  }

  return Promise.resolve();
};
