import { Client, GatewayIntentBits } from 'discord.js';
import { error, info } from '@bf2-matchmaking/logging';
import invariant from 'tiny-invariant';

invariant(process.env.DISCORD_TOKEN, 'process.env.DISCORD_TOKEN is not defined');
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});
discordClient.setMaxListeners(Number.POSITIVE_INFINITY);
export const getDiscordClient = () =>
  new Promise<Client<true>>(async (resolve, reject) => {
    if (discordClient.isReady()) {
      resolve(discordClient);
    }
    discordClient.on('ready', () => {
      info('discord-client', 'Connected');
      resolve(discordClient);
    });
    discordClient.on('error', (err) => {
      error('discord-client', err);
      reject(err);
    });
    info('discord-client', 'Connecting...');
    await discordClient.login(process.env.DISCORD_TOKEN);
  });
