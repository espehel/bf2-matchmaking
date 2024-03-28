import { ClientType, TeamSpeak, TeamSpeakChannel } from 'ts3-nodejs-library';
import { api, teamIncludes } from '@bf2-matchmaking/utils';
import { get4v4BetaConfig } from '../services/supabase-service';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { MatchQueue } from '../match/MatchQueue';
import { isDiscordConfig, MatchesJoined, TeamspeakPlayer } from '@bf2-matchmaking/types';
import QueryProtocol = TeamSpeak.QueryProtocol;

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
  if (!isDiscordConfig(config)) {
    throw new Error('Config does not contain discord channel');
  }
  const queue = await MatchQueue.fromConfig(config);
  queue.onMatchStarted(async (match, players) => {
    const [channel1, channel2] = await createMatchChannels(match);
    await Promise.all([
      movePlayers(channel1, players.filter(teamIncludes(match, '1'))),
      movePlayers(channel2, players.filter(teamIncludes(match, '2'))),
    ]);
    logMessage(`Config ${config.name}: Match started`, { match, players, queue });
  });

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

      if (queue.has(client.uniqueIdentifier)) {
        info(
          'listenToChannelJoin',
          `Client ${client.nickname} already in queue, no action taken.`
        );
        return;
      }

      const isAdded = await queue.add(client.uniqueIdentifier);
      if (isAdded) {
        info('listenToChannelJoin', `Client ${client.nickname} added to queue`);
        return;
      }

      info('listenToChannelJoin', `Client ${client.nickname} failed to add to queue`);
      client.message(getRegisterMessage(client.uniqueIdentifier));
      await client
        .poke(getRegisterPoke(client.uniqueIdentifier))
        .catch((err) => logErrorMessage('Teamspeak: Poke failed', err));
      await ts
        .clientMove(client, '20342')
        .catch((err) => logErrorMessage('Teamspeak: Move failed', err));
    } else if (queue.has(client.uniqueIdentifier)) {
      info('listenToChannelJoin', `Client ${client.nickname} left queue by move`);
      await queue.delete(client.uniqueIdentifier);
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

async function createMatchChannels(match: MatchesJoined) {
  const ts = await getTeamspeakClient();
  const channel1 = await ts.channelCreate(`Match ${match.id} Team 1`, {
    cpid: '42497',
    channelFlagTemporary: true,
  });
  const channel2 = await ts.channelCreate(`Match ${match.id} Team 2`, {
    cpid: '42497',
    channelFlagTemporary: true,
  });
  return [channel1, channel2];
}

async function movePlayers(channel: TeamSpeakChannel, players: Array<TeamspeakPlayer>) {
  const ts = await getTeamspeakClient();
  return Promise.all(players.map((p) => ts.clientMove(p.teamspeak_id, channel.cid)));
}
