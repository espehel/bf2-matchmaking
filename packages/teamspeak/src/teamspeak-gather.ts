import {
  QueryProtocol,
  TeamSpeak,
  ClientMovedEvent,
  TeamSpeakClient,
} from 'ts3-nodejs-library';
import { EventEmitter } from 'node:events';
import { BOT_CHANNEL, LOBBY_CHANNEL, QUEUE_CHANNEL } from './constants';
import { error, info } from '@bf2-matchmaking/logging';
import { api, assertObj, assertString, parseError } from '@bf2-matchmaking/utils';
import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { list } from '@bf2-matchmaking/redis/list';
import { gather } from '@bf2-matchmaking/redis/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';

export type GatherInitiatedListener = (
  clientUIds: Array<string>,
  address: string,
  gather: TeamSpeakGather
) => void;
export type PlayerJoiningListener = (clientUId: string, gather: TeamSpeakGather) => void;
export type PlayerJoinedListener = (clientUId: string, gather: TeamSpeakGather) => void;
export type PlayerRejectedListener = (
  clientUId: string,
  reason: string,
  gather: TeamSpeakGather
) => void;
export type PlayerLeftListener = (clientUId: string, gather: TeamSpeakGather) => void;
export type PlayersSummonedListener = (
  address: string,
  clientUIds: Array<string>,
  gather: TeamSpeakGather
) => void;
export type PlayerKickedListener = (
  clientUId: string,
  reason: string,
  gather: TeamSpeakGather
) => void;
export type SummonCompleteListener = (
  clientUIds: Array<string>,
  gather: TeamSpeakGather
) => void;
export type PlayerMovedListener = (
  clientUId: string,
  channel: string,
  gather: TeamSpeakGather
) => void;
export type GatherStartedListener = (
  matchId: number,
  team1: Array<string>,
  team2: Array<string>,
  gather: TeamSpeakGather
) => void;
export type NextQueueListener = (
  clientUIds: Array<string>,
  address: string,
  gather: TeamSpeakGather
) => void;
export type SummonFailListener = (
  clientUIds: Array<string>,
  gather: TeamSpeakGather
) => void;
export interface TeamSpeakGather extends EventEmitter {
  on(event: 'initiated', listener: GatherInitiatedListener): this;
  on(event: 'playerJoining', listener: PlayerJoiningListener): this;
  on(event: 'playerJoined', listener: PlayerJoinedListener): this;
  on(event: 'playerRejected', listener: PlayerRejectedListener): this;
  on(event: 'playerLeft', listener: PlayerLeftListener): this;
  on(event: 'playersSummoned', listener: PlayersSummonedListener): this;
  on(event: 'playerKicked', listener: PlayerKickedListener): this;
  on(event: 'playerMoved', listener: PlayerMovedListener): this;
  on(event: 'summonComplete', listener: SummonCompleteListener): this;
  on(event: 'gatherStarted', listener: GatherStartedListener): this;
  on(event: 'nextQueue', listener: NextQueueListener): this;
  on(event: 'summonFail', listener: SummonFailListener): this;
  on(event: 'error', listener: (e: Error) => void): this;
}

export class TeamSpeakGather extends EventEmitter {
  ts: TeamSpeak;
  config: MatchConfigsRow;
  queue: ReturnType<typeof list>;
  state: ReturnType<typeof gather.getState>;
  constructor(config: MatchConfigsRow, ts: TeamSpeak) {
    super();
    this.config = config;
    this.queue = gather.getQueue(config.id);
    this.state = gather.getState(config.id);
    this.ts = ts;
    this.ts.on('clientmoved', this.#handleClientMoved);
    this.ts.on('close', this.#handleClose);
    this.ts.on('error', this.#handleError);
  }
  async hasTimedOut() {
    const summonedAt = await this.state.getSafe('summonedAt');
    if (!summonedAt) {
      return false;
    }
    return Date.now() - Number(summonedAt) > 2 * 60 * 1000; // 2 minutes
  }
  async initQueue(address: string) {
    const queueClients = await this.ts.clientList({ cid: QUEUE_CHANNEL });
    const clientUIDs = queueClients.map((client) => client.uniqueIdentifier);
    await this.reset(address);
    await this.queue.rpush(...clientUIDs);
    this.emit('initiated', clientUIDs, this);
    return this;
  }
  #handleClientMoved = async ({ channel, client }: ClientMovedEvent) => {
    if (channel.cid === QUEUE_CHANNEL) {
      this.emit('playerJoining', client.uniqueIdentifier, this);
    }

    if (
      channel.cid !== QUEUE_CHANNEL &&
      (await this.queue.has(client.uniqueIdentifier))
    ) {
      await this.queue.remove(client.uniqueIdentifier);
      this.emit('playerLeft', client.uniqueIdentifier, this);
    }
  };
  #handleClose = async () => {
    try {
      info('TeamSpeakGatherEvents', 'Teamspeak connection closed, reconnecting...');
      await this.ts.reconnect(3, 2000);
      info('TeamSpeakGatherEvents', 'Teamspeak reconnected');
    } catch (e) {
      error('TeamSpeakGatherEvents', e);
      await this.state.set({
        status: 'Failed',
        failReason: parseError(e),
      });
    }
  };
  #handleError = async (e: Error) => {
    error('TeamSpeakGatherEvents', e);
    await this.state.set({
      status: 'Failed',
      failReason: e.message,
    });
  };
  async nextQueue(address: string) {
    await this.state.del();
    await this.state.set({
      status: 'Queueing',
      address,
    });
    const queueClients = await this.queue.range();
    this.emit('nextQueue', queueClients, this);
  }
  async reset(address: string) {
    await this.state.del();
    await this.state.set({
      status: 'Queueing',
      address,
    });
    await this.queue.del();
  }
  static async init(config: MatchConfigsRow) {
    assertString(process.env.TEAMSPEAK_PASSWORD, 'TEAMSPEAK_PASSWORD not defined');
    const ts = await TeamSpeak.connect({
      host: 'oslo21.spillvert.no',
      queryport: 10022,
      protocol: QueryProtocol.SSH,
      serverport: 10014,
      username: 'bf2.gg',
      password: process.env.TEAMSPEAK_PASSWORD,
      nickname: 'bf2.gg',
      autoConnect: false,
    });

    return new TeamSpeakGather(config, ts);
  }
  async acceptPlayer(clientUId: string) {
    const queueLength = await this.queue.rpush(clientUId);
    this.emit('playerJoined', clientUId, this);

    const status = await this.state.get('status');
    if (queueLength >= this.config.size && status === GatherStatus.Queueing) {
      await this.#summonPlayers();
    }
  }
  async rejectPlayer(clientUId: string, reason: 'tsid' | 'keyhash') {
    const message =
      reason === 'tsid' ? getRegisterTsIdMessage(clientUId) : getRegisterKeyhashMessage();
    const poke =
      reason === 'tsid' ? getRegisterTsIdPoke(clientUId) : getRegisterKeyhashPoke();

    await this.messageClient(clientUId, message, poke);
    this.emit('playerRejected', clientUId, reason, this);
  }
  async #summonPlayers() {
    await this.state.set({
      status: GatherStatus.Summoning,
      summonedAt: Date.now().toString(),
    });

    const server = await this.state.get('address');
    const clients = await this.queue.range(0, this.config.size);
    for (const clientUId of clients) {
      await this.messageClient(clientUId, getSummonMessage(server));
    }

    this.emit('playersSummoned', server, clients, this);
  }
  async verifySummon(clientUIds: Array<string>) {
    const summonedClients = await this.queue.range(0, this.config.size);
    const missingClients = summonedClients.filter((id) => !clientUIds.includes(id));

    if (missingClients.length === 0) {
      this.emit('summonComplete', summonedClients, this);
      await this.state.set({ status: 'Starting', summonedAt: null });
      return 'OK';
    }

    if (await this.hasTimedOut()) {
      for (const clientUId of missingClients) {
        await this.kickClient(
          clientUId,
          'You failed to join server and have been removed from the queue.'
        );
      }
      await this.state.set({ status: 'Queueing', summonedAt: null });
      this.emit('summonFail', missingClients, this);
      return 'Fail';
    }

    return null;
  }
  async movePlayer(channelId: string, clientUId: string) {
    const client = await this.ts.getClientByUid(clientUId);
    assertObj(client, `Client ${clientUId} not found in teamspeak client list`);
    await this.ts.clientMove(client, channelId);
    this.emit('playerMoved', clientUId, channelId, this);
  }
  async initiateMatchChannels(
    matchId: number,
    team1: Array<string>,
    team2: Array<string>
  ) {
    const channel1 = await this.ts.channelCreate(`Match ${matchId} Team 1`, {
      cpid: BOT_CHANNEL,
      channelFlagTemporary: false,
      channelFlagSemiPermanent: true,
    });
    const channel2 = await this.ts.channelCreate(`Match ${matchId} Team 2`, {
      cpid: BOT_CHANNEL,
      channelFlagTemporary: false,
      channelFlagSemiPermanent: true,
    });

    await this.queue.popBulk(this.config.size);
    for (const player of team1) {
      await this.movePlayer(channel1.cid, player);
    }
    for (const player of team2) {
      await this.movePlayer(channel2.cid, player);
    }

    await channel1.edit({
      channelFlagTemporary: true,
      channelFlagSemiPermanent: false,
    });
    await channel2.edit({
      channelFlagTemporary: true,
      channelFlagSemiPermanent: false,
    });
    this.emit('gatherStarted', matchId, team1, team2, this);
  }
  async kickClient(clientUId: string, reason: string) {
    const client = await this.ts.getClientByUid(clientUId);
    assertObj(client, `Client ${clientUId} not found in teamspeak client list`);
    await this.messageClient(client, reason);
    await client.move(LOBBY_CHANNEL);
    this.emit('playerKicked', clientUId, reason, this);
  }
  async messageClient(
    client: string | TeamSpeakClient | undefined,
    message: string,
    poke?: string
  ) {
    const resolvedClient =
      typeof client === 'string' ? await this.ts.getClientByUid(client) : client;
    assertObj(
      resolvedClient,
      `Client ${resolvedClient}: Failed to send message, client not found in teamspeak client list`
    );
    await resolvedClient.poke(poke ?? message);
    await resolvedClient.message(message);
  }
}

function getRegisterTsIdMessage(id: string) {
  return `You must link your Teamspeak Id to your Discord User before queueing. Register Discord Id at ${api
    .web()
    .teamspeakPage(id)} and rejoin channel.`;
}

function getRegisterTsIdPoke(id: string) {
  return `Register Teamspeak Id at ${api.web().teamspeakPage(id)}`;
}
function getRegisterKeyhashMessage() {
  return `You must link your BF2 keyhash to your Discord User before queuing. Register Discord Id at ${api
    .web()
    .teamspeakPage()} and rejoin channel.`;
}
function getRegisterKeyhashPoke() {
  return `Register keyhash at ${api.web().teamspeakPage()}`;
}
function getSummonMessage(address: string) {
  return `Join ${address} within 2 minutes or be removed from the gather.`;
}
