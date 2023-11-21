import {
  DiscordConfig,
  DiscordMatch,
  isDiscordMatch,
  LocationEmoji,
  MatchesJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { Embed, EmbedBuilder, Message, UserManager } from 'discord.js';
import { compareMessageReactionCount, toMatchPlayer } from './utils';
import { logMessage } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getOrCreatePlayer } from './supabase-service';
import { DateTime } from 'luxon';
import { assertNumber } from '@bf2-matchmaking/utils';
import {
  getServerLocation,
  getServerLocationEmojis,
  isValidReaction,
} from './location-service';
import {
  createServerLocationPollField,
  getLiveMatchField,
} from '@bf2-matchmaking/discord';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { getTestChannel } from '../discord/utils';

const pubobotMatchMap = new Map<number, number>();
export function getPubobotId(embed: Embed) {
  return Number(embed?.footer?.text?.replace('Match id: ', '')) || null;
}
export function hasPubotId(id: number) {
  return pubobotMatchMap.has(id);
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

export async function startTopLocationPoll(
  match: MatchesJoined,
  message: Message
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const pollEndTime = DateTime.now().plus({ seconds: 30 });

    const channel = await getTestChannel();
    const pollMessage = await channel.send({
      embeds: [
        new EmbedBuilder().addFields(
          createServerLocationPollField(),
          getLiveMatchField(match)
        ),
      ],
    }); // TODO: change to message.channel
    logMessage(`Channel ${channel.id}: Poll created for Match ${match.id}`, {
      match,
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
            new EmbedBuilder().addFields(
              createServerLocationPollField(locationName),
              getLiveMatchField(match)
            ),
          ],
        });
      }
      logMessage(
        `Channel ${pollMessage.channel.id}: Poll updated with result for Match ${match.id}`,
        {
          match,
          locationName,
        }
      );

      resolve(location);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}
