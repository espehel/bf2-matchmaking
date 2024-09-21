import { Client, GatewayIntentBits } from 'discord.js';
import { error, info } from '@bf2-matchmaking/logging';

export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildScheduledEvents,
  ],
});
discordClient.setMaxListeners(10);
discordClient.on('ready', () => {
  info('discord-client', 'Connected');
});
discordClient.on('error', (err) => {
  error('discord-client', err);
});
