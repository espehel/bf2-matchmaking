import { TeamspeakBot } from './TeamspeakBot';
import { getMatchConfig } from '@bf2-matchmaking/services/config';
import { info } from '@bf2-matchmaking/logging';
import { TeamSpeakClient } from 'ts3-nodejs-library';
import * as queue from '@bf2-matchmaking/redis/gather';
import { getTeamspeakPlayer } from '@bf2-matchmaking/services/players';
import { isGatherPlayer, isNotNull, MatchStatus } from '@bf2-matchmaking/types';
import { startReadServerTask } from '../tasks/readServerTask';
import { topic } from '@bf2-matchmaking/redis/topic';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import {
  getGatherPlayer,
  getGatherPlayerKeyhash,
  setGatherPlayer,
} from '@bf2-matchmaking/redis/gather';
import { assertObj } from '@bf2-matchmaking/utils';
import { Match } from '@bf2-matchmaking/services/matches/Match';
import { buildDraftWithConfig } from '../services/draft-service';
import { hasEqualKeyhash, toMatchPlayer } from '../utils/player-utils';
import { Gather } from '@bf2-matchmaking/services/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';

let state: 'queue' | 'ready' | 'match' = 'queue';

export async function initGatherQueue() {
  const ts = await TeamspeakBot.connect();
  const config = await getMatchConfig(20);

  await Gather(config.id).init();

  ts.onClientJoined(handleClientJoin);
  ts.onClientLeft(handleClientLeft);

  async function handleClientJoin(client: TeamSpeakClient) {
    if (await queue.hasPlayer(client.uniqueIdentifier)) {
      info(
        'listenToChannelJoin',
        `Client ${client.nickname} already in queue, no action taken.`
      );
      return;
    }

    const player = await getTeamspeakPlayer(client.uniqueIdentifier);
    if (!player) {
      await ts.kickUnregisteredClient(client);
      return;
    }
    if (!isGatherPlayer(player)) {
      await ts.kickClient(client, 'Missing keyhash', 'Missing keyhash');
      return;
    }
    await setGatherPlayer(player);

    const length = await queue.addPlayer(client.uniqueIdentifier);

    if (state === 'queue' && length === config.size) {
      await handleQueueFull();
    }
  }

  async function handleClientLeft(client: TeamSpeakClient) {
    await queue.removePlayer(client.uniqueIdentifier);
  }

  async function handleQueueFull() {
    const matchPlayers = await queue.popMatchPlayers(config.size);
    assertObj(matchPlayers, 'Match players not found');
    const keyhashes = (
      await Promise.all(matchPlayers.map(getGatherPlayerKeyhash))
    ).filter(isNotNull);

    await Gather(config.id).summon();
    await createMatch(keyhashes);

    startReadServerTask('cphdock.bf2.top');
    await topic('server:cphdock.bf2.top').subscribe<LiveInfo>(onLiveInfo);
  }

  async function onLiveInfo(live: LiveInfo) {
    const status = await Gather(config.id).getStatus();
    if (status !== GatherStatus.Summoning) {
      await topic('server:cphdock.bf2.top').unsubscribe();
      return;
    }

    const match = await Gather(config.id).getMatch();
    const connectedHashes = match.players
      .filter(isGatherPlayer)
      .filter((player) => live.players.some(hasEqualKeyhash(player)));

    if (connectedHashes.length === config.size) {
      await Gather(config.id).play();
    }
  }

  async function createMatch(queuePlayers: Array<string>) {
    const summoningMatch = await Match.create({
      config: config.id,
      status: MatchStatus.Summoning,
    });

    const players = (await Promise.all(queuePlayers.map(getGatherPlayer))).filter(
      isNotNull
    );

    const matchPlayers = await buildDraftWithConfig(
      players.map(toMatchPlayer(summoningMatch.id)),
      config
    );
    await Match.update(summoningMatch.id).setTeams(matchPlayers).commit();
  }
}
