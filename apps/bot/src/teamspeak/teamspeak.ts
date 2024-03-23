import { ClientType, TeamSpeak } from 'ts3-nodejs-library';
import QueryProtocol = TeamSpeak.QueryProtocol;
import { api, assertObj } from '@bf2-matchmaking/utils';
import { getPlayerByTeamspeakId } from '../services/supabase-service';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';

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

const queuedClients = new Set<string>();

export async function listenToChannelJoin() {
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
      const player = await getPlayerByTeamspeakId(client.uniqueIdentifier);
      if (player) {
        info('listenToChannelJoin', `Client ${player.nick} joined queue`);
        queuedClients.add(client.uniqueIdentifier);
      } else {
        client.message(getRegisterMessage(client.uniqueIdentifier));
        await client
          .poke(getRegisterPoke(client.uniqueIdentifier))
          .catch((err) => logErrorMessage('Teamspeak: Poke failed', err));
        await ts
          .clientMove(client, '20342')
          .catch((err) => logErrorMessage('Teamspeak: Move failed', err));
      }
    } else if (queuedClients.has(client.uniqueIdentifier)) {
      info('listenToChannelJoin', `Client ${client.nickname} left queue by move`);
      queuedClients.delete(client.uniqueIdentifier);
    }
  });

  ts.on('clientdisconnect', ({ client }) => {
    if (client && queuedClients.has(client.uniqueIdentifier)) {
      info('listenToChannelJoin', `Client ${client.nickname} left queue by disconnect`);
      queuedClients.delete(client.uniqueIdentifier);
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
