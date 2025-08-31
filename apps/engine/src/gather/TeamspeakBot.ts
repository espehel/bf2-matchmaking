import { QueryProtocol, TeamSpeak, TeamSpeakClient } from 'ts3-nodejs-library';
import { error, info, logErrorMessage, warn } from '@bf2-matchmaking/logging';
import { ClientDisconnect, ClientMoved } from 'ts3-nodejs-library/lib/types/Events';
import { api, assertString, teamIncludes } from '@bf2-matchmaking/utils';
import { isGatherPlayer, MatchesJoined, TeamspeakPlayer } from '@bf2-matchmaking/types';

assertString(process.env.TEAMSPEAK_PASSWORD, 'TEAMSPEAK_PASSWORD not defined');

const LOBBY_CHANNEL = '20342';
const QUEUE_CHANNEL = '42497';
const BOT_CHANNEL = '42497';

export class TeamspeakBot {
  isConnected: boolean = true;
  #ts: TeamSpeak;
  #queueingPlayers: Map<string, string>;
  clientJoinedCB: ((client: TeamSpeakClient) => void) | null = null;
  clientLeftCB: ((client: TeamSpeakClient) => void) | null = null;

  constructor(ts: TeamSpeak, queueClients: Array<TeamSpeakClient>) {
    this.#ts = ts;
    this.#queueingPlayers = new Map(
      queueClients.map((client) => [client.uniqueIdentifier, client.clid])
    );
    ts.on('close', () => {
      warn('TeamspeakBot', 'Teamspeak connection closed');
      this.isConnected = false;
    });
    ts.on('error', (err) => {
      logErrorMessage('TeamspeakBot failed', err);
      this.isConnected = false;
    });
    ts.on('clientmoved', this.#handleClientMoved.bind(this));
    ts.on('clientdisconnect', this.#handleClientDisconnected.bind(this));
  }
  async getTS() {
    if (!this.isConnected) {
      await this.#ts.reconnect();
      info('TeamspeakBot', 'Reconnected to teamspeak');
      this.isConnected = true;
    }
    return this.#ts;
  }
  onClientJoined(cb: (client: TeamSpeakClient) => void) {
    this.clientJoinedCB = cb;
  }
  onClientLeft(cb: (client: TeamSpeakClient) => void) {
    this.clientLeftCB = cb;
  }
  #handleClientMoved({ client, channel }: ClientMoved) {
    if (channel.cid === QUEUE_CHANNEL) {
      info('TeamspeakBot', `Client ${client.nickname} joined queue`);
      this.#queueingPlayers.set(client.uniqueIdentifier, client.clid);
      if (this.clientJoinedCB) {
        return this.clientJoinedCB(client);
      }
    }

    if (
      channel.cid !== QUEUE_CHANNEL &&
      this.#queueingPlayers.has(client.uniqueIdentifier)
    ) {
      info('TeamspeakBot', `Client ${client.nickname} left queue by move`);
      this.#queueingPlayers.delete(client.uniqueIdentifier);
      if (this.clientLeftCB) return this.clientLeftCB(client);
    }
  }
  #handleClientDisconnected({ client }: ClientDisconnect) {
    if (client && this.#queueingPlayers.has(client.uniqueIdentifier)) {
      info('TeamspeakBot', `Client ${client.nickname} left queue by disconnect`);
      this.#queueingPlayers.delete(client.uniqueIdentifier);
      if (this.clientLeftCB) return this.clientLeftCB(client);
    }
  }
  async kickClient(tsClient: TeamSpeakClient | string, poke: string, message: string) {
    const ts = await this.getTS();
    const clid =
      typeof tsClient === 'string' ? this.#queueingPlayers.get(tsClient) : tsClient.clid;

    if (!clid) {
      warn('TeamspeakBot', 'Kick failed due to noe clid');
      return;
    }

    info('TeamspeakBot', `Kicking ${clid} by ${poke}: ${message}`);
    await ts
      .clientPoke(clid, poke)
      .catch((err) => logErrorMessage('TeamspeakBot: Poke failed', err));
    await ts
      .clientMove(clid, LOBBY_CHANNEL)
      .catch((err) => logErrorMessage('TeamspeakBot: Move failed', err));

    const client =
      typeof tsClient !== 'string'
        ? tsClient
        : await ts
            .getClientById(clid)
            .catch((err) =>
              logErrorMessage('TeamspeakBot: Get client to send message failed', err)
            );
    if (client) {
      client.message(message);
    }
  }

  async kickUnregisteredClient(tsClient: TeamSpeakClient | string) {
    const identifier =
      typeof tsClient === 'string' ? tsClient : tsClient.uniqueIdentifier;
    await this.kickClient(
      tsClient,
      getRegisterPoke(identifier),
      getRegisterMessage(identifier)
    );
  }
  async kickLatePlayers(players: Array<string>) {
    const kickMessage = 'You failed to join server in time and are removed from queue';
    for (const player of players) {
      await this.kickClient(player, kickMessage, kickMessage);
    }
  }

  movePlayer(channelId: string) {
    return async (player: TeamspeakPlayer) => {
      const clid = this.#queueingPlayers.get(player.teamspeak_id);
      info(
        'TeamspeakBot',
        `Moving player ${player.teamspeak_id}(${clid}) to ${channelId}`
      );
      return clid
        ? (await this.getTS()).clientMove(clid, channelId).catch((err) =>
            logErrorMessage('TeamspeakBot: Move player failed', err, {
              channelId,
              player,
              clid,
            })
          )
        : false;
    };
  }

  async initiateMatchChannels(match: MatchesJoined) {
    try {
      const ts = await this.getTS();
      const channel1 = await ts.channelCreate(`Match ${match.id} Team 1`, {
        cpid: BOT_CHANNEL,
        channelFlagTemporary: false,
        channelFlagSemiPermanent: true,
      });
      const channel2 = await ts.channelCreate(`Match ${match.id} Team 2`, {
        cpid: BOT_CHANNEL,
        channelFlagTemporary: false,
        channelFlagSemiPermanent: true,
      });

      for (const player of match.players) {
        if (!isGatherPlayer(player)) {
          continue;
        }
        if (teamIncludes(match, 1)(player)) {
          await this.movePlayer(channel1.cid)(player);
        }
        if (teamIncludes(match, 2)(player)) {
          await this.movePlayer(channel2.cid)(player);
        }
      }

      await channel1.edit({
        channelFlagTemporary: true,
        channelFlagSemiPermanent: false,
      });
      await channel2.edit({
        channelFlagTemporary: true,
        channelFlagSemiPermanent: false,
      });
    } catch (err) {
      logErrorMessage('TeamspeakBot: Initiate match channels failed', err, {
        match,
      });
    }
  }
  getQueueingPlayers() {
    return Array.from(this.#queueingPlayers.keys());
  }
  async clearQueueChannel() {
    const ts = await this.getTS();
    const clients = await ts.clientList({ cid: QUEUE_CHANNEL });
    for (const client of clients) {
      await this.kickClient(client, 'Resetting queue', 'Resetting queue');
    }
  }
  static async connect() {
    const ts = await TeamSpeak.connect({
      host: 'oslo21.spillvert.no',
      queryport: 10022,
      protocol: QueryProtocol.SSH,
      serverport: 10014,
      username: 'bf2.gg',
      password: process.env.TEAMSPEAK_PASSWORD,
      nickname: 'bf2.gg',
    });
    info('TeamspeakBot', 'Connected to teamspeak');
    const queueClients = await ts.clientList({ cid: QUEUE_CHANNEL });
    info('TeamspeakBot', `Initializing with ${queueClients.length} clients in queue`);
    return new TeamspeakBot(ts, queueClients);
  }
}

function getRegisterMessage(id: string) {
  return `You must link your Teamspeak Id to your Discord User before queueing. Register Discord Id at ${api
    .web()
    .teamspeakPage(id)} and rejoin channel.`;
}

function getRegisterPoke(id: string) {
  return `Register Discord Id at ${api.web().teamspeakPage(id)}`;
}
