import { DiscordConfig, MatchStatus, RconBf2Server, User } from '@bf2-matchmaking/types';
import {
  Embed,
  MessageReaction,
  TextChannel,
  User as DiscordUser,
  UserManager,
} from 'discord.js';
import { api } from '@bf2-matchmaking/utils';
import { getServerEmbed, getServerPollEmbed } from '@bf2-matchmaking/discord';
import { getServerPlayerCount, getServerTupleList } from './server-interactions';
import { compareMessageReactionCount, toMatchPlayer } from './utils';
import moment from 'moment';
import {
  logCreateChannelMessage,
  logEditChannelMessage,
  logOngoingMatchCreated,
} from '@bf2-matchmaking/logging';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getOrCreatePlayer } from './match-interactions';

export const createMatchFromPubobotEmbed = async (
  embed: Embed,
  users: UserManager,
  configId: number,
  serverIp: string
) => {
  const match = await client().createMatchFromConfig(configId).then(verifySingleResult);

  const team1 = await Promise.all(
    getUserIds(embed, 'USMC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );
  const team2 = await Promise.all(
    getUserIds(embed, 'MEC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );

  await Promise.all([
    client().createMatchPlayers(team1.map(toMatchPlayer(match.id, 'a'))),
    client().createMatchPlayers(team2.map(toMatchPlayer(match.id, 'b'))),
  ]);

  const updatedMatch = await client()
    .updateMatch(match.id, {
      status: MatchStatus.Ongoing,
      started_at: moment().toISOString(),
      server: serverIp,
    })
    .then(verifySingleResult);

  logOngoingMatchCreated(updatedMatch);
  return updatedMatch;
};

const getUserIds = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=<@)\d+(?=>)/g) || [];

export const sendServerPollMessage = async (
  config: DiscordConfig,
  channel: TextChannel,
  onServerChosen: (server: RconBf2Server) => void
) => {
  const servers = await getServerTupleList();

  const pollEndTime = moment().add(1, 'minute');
  const message = await channel.send({
    embeds: [getServerPollEmbed(servers, pollEndTime)],
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

    const { server, error } = getTopServer(servers, topEmoji);

    if (!server) {
      return await channel.send(error);
    }

    const resultMessage = await channel.send({
      embeds: [getServerEmbed(server)],
    });

    logCreateChannelMessage(
      channel.id,
      resultMessage.id,
      resultMessage.embeds[0].description,
      resultMessage.embeds[0]
    );
    onServerChosen(server);
  }, pollEndTime.diff(moment()));
};

// TODO: Automatically returns frankfurt server if available and no votes, to get some data going
const PBASE_FRANKFURT = '95.179.167.83';
function getTopServer(
  servers: Array<[RconBf2Server, string, string]>,
  topEmoji: MessageReaction | undefined
) {
  if (!topEmoji || topEmoji.count < 2) {
    const frankFurtServer = servers.find(([server]) => server.ip === PBASE_FRANKFURT);
    if (frankFurtServer && getServerPlayerCount(frankFurtServer[0]) === 'available') {
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
