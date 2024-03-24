import { ClientType, TeamSpeak } from 'ts3-nodejs-library';
import QueryProtocol = TeamSpeak.QueryProtocol;
import { api, assertObj } from '@bf2-matchmaking/utils';
import { get4v4BetaConfig, getPlayerByTeamspeakId } from '../services/supabase-service';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { getTextChannelFromConfig } from '../discord/discord-utils';
import { PubobotQueue } from '../services/pubobot/PubobotQueue';

let teamspeakClient: TeamSpeak | undefined;
export async function getTeamspeakClient() {
  if (!teamspeakClient) {
    teamspeakClient = await TeamSpeak.connect({
      host: 'oslo21.spillvert.no',
      queryport: 10022,
      protocol: QueryProtocol.SSH,
      serverport: 10014,
      username: 'bf2.gg',
      password: 'cbVzQhD2',
      nickname: 'bf2.gg',
    });
  }
  return teamspeakClient;
}

export async function getClientList() {
  const ts = await getTeamspeakClient();
  //return ts.channelList();
  //const channel = await ts.getChannelById('42496');
  //assertObj(channel, 'Failed to get channel');
  //return channel.getClients();
  return ts.clientList({ clientType: ClientType.Regular });
}

export async function listenToChannelJoin() {
  const config = await get4v4BetaConfig();
  const queue = await PubobotQueue.fromConfig(config);

  const ts = await getTeamspeakClient();
  ts.on('clientmoved', async ({ client, channel, reasonid }) => {
    info(
      'listenToChannelJoin',
      `Client ${client.uniqueIdentifier} moved: ${channel.cid}. Reason: ${reasonid}`
    );

    if (channel.cid === '42497') {
      info(
        'listenToChannelJoin',
        `Client ${client.nickname} joined channel ${channel.name}`
      );

      const isAdded = await queue.add(client.uniqueIdentifier);
      if (!isAdded) {
        client.message(getRegisterMessage(client.uniqueIdentifier));
        await client
          .poke(getRegisterPoke(client.uniqueIdentifier))
          .catch((err) => logErrorMessage('Teamspeak: Poke failed', err));
        await ts
          .clientMove(client, '20342')
          .catch((err) => logErrorMessage('Teamspeak: Move failed', err));
      }
    } else if (queue.has(client.uniqueIdentifier)) {
      info('listenToChannelJoin', `Client ${client.nickname} left queue by move`);
      queue.delete(client.uniqueIdentifier);
    }
  });

  ts.on('clientdisconnect', ({ client }) => {
    if (client && queue.has(client.uniqueIdentifier)) {
      info('listenToChannelJoin', `Client ${client.nickname} left queue by disconnect`);
      queue.delete(client.uniqueIdentifier);
    }
  });
}

function getRegisterMessage(id: string) {
  return `You must link your Teamspeak Id to your Discord User before queueing. Register Discord Id at ${api
    .web()
    .teamspeakPage(id)} and rejoin channel.`;
}

function getRegisterPoke(id: string) {
  return `Register Discord Id at ${api.web().teamspeakPage(id)}`;
}
