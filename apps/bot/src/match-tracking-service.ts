import {
  DiscordConfig,
  DiscordMatch,
  isDiscordMatch,
  MatchesJoined,
  MatchStatus,
  RconBf2Server,
} from '@bf2-matchmaking/types';
import { Embed, MessageReaction, TextBasedChannel, UserManager } from 'discord.js';
import { getServerPollEmbed } from '@bf2-matchmaking/discord';
import { getServerTupleList } from './server-interactions';
import { compareMessageReactionCount, isTextBasedChannel, toMatchPlayer } from './utils';
import moment from 'moment';
import {
  info,
  logCreateChannelMessage,
  logOngoingMatchCreated,
} from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getOrCreatePlayer } from './match-interactions';

export const createMatchFromPubobotEmbed = async (
  embed: Embed,
  users: UserManager,
  config: DiscordConfig
): Promise<DiscordMatch> => {
  const match = await client().createMatchFromConfig(config.id).then(verifySingleResult);

  const team1 = await Promise.all(
    getUserIds(embed, 'USMC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );
  const team2 = await Promise.all(
    getUserIds(embed, 'MEC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );

  await Promise.all([
    client().createMatchPlayers(team1.map(toMatchPlayer(match.id, 1))),
    client().createMatchPlayers(team2.map(toMatchPlayer(match.id, 2))),
  ]);

  const updatedMatch = await client()
    .updateMatch(match.id, {
      status: MatchStatus.Ongoing,
      started_at: moment().toISOString(),
    })
    .then(verifySingleResult);

  if (!isDiscordMatch(updatedMatch)) {
    throw new Error(`Match ${updatedMatch.id} is not a Discord match`);
  }

  logOngoingMatchCreated(updatedMatch);
  info('passiveCollector', `Created match ${match.id} for ${config.name} channel`);
  return updatedMatch;
};

const getUserIds = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=<@)\d+(?=>)/g) || [];

export const getTopServerPollResult = async (
  match: MatchesJoined,
  channel: TextBasedChannel
): Promise<RconBf2Server> =>
  new Promise(async (resolve, reject) => {
    if (!isTextBasedChannel(channel)) {
      return reject('Message did not come from text based channel');
    }
    const servers = await getServerTupleList();

    const pollEndTime = moment().add(1, 'minute');
    const message = await channel.send({
      embeds: [getServerPollEmbed(match, servers, pollEndTime)],
    });
    await Promise.all(servers.map(([, , emoji]) => message.react(emoji)));
    logCreateChannelMessage(
      channel.id,
      message.id,
      message.embeds[0].description,
      message.embeds[0]
    );

    setTimeout(async () => {
      const topEmoji = message.reactions.cache.sort(compareMessageReactionCount).at(0);
      const { server, error: err } = getTopServer(servers, topEmoji);
      if (!server) {
        return reject(err);
      }
      resolve(server);
    }, pollEndTime.diff(moment()));
  });

// TODO: Automatically returns frankfurt server if available and no votes, to get some data going
const PBASE_FRANKFURT = '95.179.167.83';
function getTopServer(
  servers: Array<[RconBf2Server, string, string]>,
  topEmoji: MessageReaction | undefined
) {
  if (!topEmoji || topEmoji.count < 2) {
    const frankFurtServer = servers.find(([server]) => server.ip === PBASE_FRANKFURT);
    if (
      frankFurtServer &&
      frankFurtServer[0].info &&
      frankFurtServer[0].info.connectedPlayers === '0'
    ) {
      return { error: null, server: frankFurtServer[0] };
    }
    return { error: 'No votes received.', server: null };
  }

  const topServer = servers.find(([, , emoji]) => topEmoji.emoji.name === emoji);
  if (!topServer) {
    return { error: 'Failed to add match server', server: null };
  }
  return { server: topServer[0], error: null };
}
