import {
  DiscordConfig,
  DiscordMatch,
  GameStatus,
  isDiscordMatch,
  LocationEmoji,
  MatchStatus,
  RconBf2Server,
} from '@bf2-matchmaking/types';
import { Embed, EmbedBuilder, Message, MessageReaction, UserManager } from 'discord.js';
import {
  compareMessageReactionCount,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
  toMatchPlayer,
} from './utils';
import { logMessage } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getOrCreatePlayer } from './match-interactions';
import { DateTime } from 'luxon';
import { assertNumber } from '@bf2-matchmaking/utils';
import {
  getServerLocation,
  getServerLocationEmojis,
  isValidReaction,
} from './services/locations';
import { createServerLocationPollField } from '@bf2-matchmaking/discord';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';

const pubobotMatchMap = new Map<number, number>();
export function getPubobotId(embed: Embed) {
  return Number(embed?.footer?.text?.replace('Match id: ', '')) || null;
}

export function messageFilter(message: Message) {
  if (message.content === 'test embed') {
    return true;
  }
  const [embed] = message.embeds;
  const pubobotId = getPubobotId(embed);
  if (!pubobotId) {
    return false;
  }
  if (isPubobotMatchStarted(embed)) {
    return true;
  }
  return isPubobotMatchDrafting(embed) && !pubobotMatchMap.has(pubobotId);
}

export async function createDraftingMatchFromPubobotEmbed(
  embed: Embed,
  users: UserManager,
  config: DiscordConfig
): Promise<DiscordMatch> {
  const pubobotId = getPubobotId(embed);
  assertNumber(pubobotId, 'Failed to create match, Invalid embed');

  const match = await client()
    .createMatchFromConfig(config.id, { status: MatchStatus.Drafting })
    .then(verifySingleResult);

  if (!isDiscordMatch(match)) {
    throw new Error(`Match ${match.id} is not a Discord match`);
  }
  pubobotMatchMap.set(pubobotId, match.id);
  logMessage(`Match ${match.id}: Created with status ${match.status}`, {
    match,
    config,
  });
  return match;
}

export async function startMatchFromPubobotEmbed(
  embed: Embed,
  users: UserManager
): Promise<DiscordMatch> {
  const pubobotId = getPubobotId(embed);
  const matchId = pubobotId ? pubobotMatchMap.get(pubobotId) : undefined;

  if (!matchId) {
    throw new Error(`Failed to get matchId from pubobotId ${pubobotId}`);
  }

  const match = await client().getMatch(matchId).then(verifySingleResult);

  const team1 = await Promise.all(
    getUserIds(embed, 'USMC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );
  const team2 = await Promise.all(
    getUserIds(embed, 'MEC').map((player) => users.fetch(player).then(getOrCreatePlayer))
  );

  const { data: ratings } = await client().getPlayerRatingsByIdList(
    team1.concat(team2).map((p) => p.id),
    match.config.id
  );

  await Promise.all([
    client().createMatchPlayers(team1.map(toMatchPlayer(match.id, 1, ratings || []))),
    client().createMatchPlayers(team2.map(toMatchPlayer(match.id, 2, ratings || []))),
  ]);

  const updatedMatch = await client()
    .updateMatch(match.id, {
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    })
    .then(verifySingleResult);

  if (!isDiscordMatch(updatedMatch)) {
    throw new Error(`Match ${updatedMatch.id} is not a Discord match`);
  }

  logMessage(`Match ${match.id}: Updated teams, set status ${updatedMatch.status}`, {
    match: updatedMatch,
  });
  return updatedMatch;
}

const getUserIds = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=<@)\d+(?=>)/g) || [];

export async function getTopLocationPollResult(message: Message): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const pollEndTime = DateTime.now().plus({ seconds: 30 });

    const pollMessage = await message.channel.send({
      embeds: [new EmbedBuilder().addFields(createServerLocationPollField())],
    });

    for (const emoji of getServerLocationEmojis()) {
      await pollMessage.react(emoji);
    }

    setTimeout(async () => {
      const topEmoji = pollMessage.reactions.cache
        .filter(isValidReaction)
        .sort(compareMessageReactionCount)
        .at(0);

      const location = getServerLocation(topEmoji?.emoji.name);
      if (!location) {
        return reject('Unable to get location');
      }

      const locationName = getKey(LocationEmoji, topEmoji?.emoji.name);
      if (locationName) {
        await pollMessage.edit({
          embeds: [
            new EmbedBuilder().addFields(createServerLocationPollField(locationName)),
          ],
        });
      }

      resolve(location);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}
