import {
  DiscordConfig,
  DiscordMatch,
  isDiscordMatch,
  isNotNull,
  LocationEmoji,
  MatchesJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { Embed, Message, UserManager, GuildMemberManager } from 'discord.js';
import { compareMessageReactionCount, toMatchPlayer } from './utils';
import { logMessage } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { findMapId, getOrCreatePlayer } from './supabase-service';
import { DateTime } from 'luxon';
import { assertNumber, assertObj } from '@bf2-matchmaking/utils';
import {
  getServerLocation,
  getServerLocationEmojis,
  isValidReaction,
} from './location-service';
import {
  createServerLocationPollField,
  createServerLocationPollResultField,
  getMatchField,
} from '@bf2-matchmaking/discord';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { PubobotMatch } from './PubobotMatch';

let pubobotMatches: Array<PubobotMatch> = [];
function addMatch(match: PubobotMatch) {
  pubobotMatches = [...pubobotMatches.filter((m) => m.id !== match.id), match];
}

export function addCheckinMatch(embed: Embed) {
  let match = PubobotMatch.fromCheckInEmbed(embed);
  if (match) {
    match.addCheckinPlayers(embed);
    addMatch(match);
  }
  return match;
}
export async function addDraftingMatch(message: Message<true>) {
  const [embed] = message.embeds;
  const match = getPubobotMatch(embed) || PubobotMatch.fromDraftingEmbed(embed);
  if (!match) {
    return null;
  }
  await match.addDraftingPlayers(embed, message.guild.members);
  match.setMap(embed);
  addMatch(match);
  return match;
}
export function getPubobotId(embed: Embed) {
  return Number(embed?.footer?.text?.replace('Match id: ', '')) || null;
}
export function getPubobotMatch(embed: Embed) {
  return pubobotMatches.find((m) => m.id === getPubobotId(embed));
}
export function hasPubotId(id: number, state: 'drafting' | 'checkin') {
  return pubobotMatches.some((match) => match.id === id && match.state === state);
}

export async function getGuildMemberIds(embed: Embed, guild: GuildMemberManager) {
  const searchGuild = async (nick: string) => {
    const result = await guild.search({ query: nick });
    return result.at(0)?.id || null;
  };
  return (
    await Promise.all(
      [
        getUserNames(embed, 'MEC'),
        getUserNames(embed, 'USMC'),
        getUserNames(embed, 'Unpicked'),
      ]
        .flat()
        .map(searchGuild)
    )
  ).filter(isNotNull);
}

async function createDraftingMatchPlayers(match_id: number, playerIds: Array<string>) {
  const { data: players } = await client().getPlayersByIdList(playerIds);
  if (!players) {
    return [];
  }
  const { data: matchPlayers } = await client().createMatchPlayers(
    players.map(({ id }) => ({ player_id: id, match_id }))
  );
  return matchPlayers || [];
}

export async function createDraftingMatchFromPubobotEmbed(
  message: Message<true>,
  config: DiscordConfig
): Promise<DiscordMatch> {
  const pubobotMatch = await addDraftingMatch(message);
  assertObj(pubobotMatch, 'Failed to parse pubobot match');

  const match = await client()
    .createMatchFromConfig(config.id, { status: MatchStatus.Drafting })
    .then(verifySingleResult);

  if (!isDiscordMatch(match)) {
    throw new Error(`Match ${match.id} is not a Discord match`);
  }
  pubobotMatch.setMatchId(match.id);

  const matchPlayers = await createDraftingMatchPlayers(
    match.id,
    pubobotMatch.getPlayers()
  );

  const map = pubobotMatch.map ? await findMapId(pubobotMatch.map) : null;
  if (map) {
    await client().createMatchMaps(match.id, map).then(verifySingleResult);
  }

  logMessage(`Match ${match.id}: Created with status ${match.status}`, {
    match,
    config,
    pubobotMatch,
    matchPlayers,
  });
  return match;
}

export async function startMatchFromPubobotEmbed(
  embed: Embed,
  users: UserManager
): Promise<DiscordMatch> {
  const pubobotMatch = getPubobotMatch(embed);
  assertObj(pubobotMatch, 'Failed to get pubobot match');
  assertNumber(pubobotMatch.matchId, 'Pubobotmatch does not have a match id');

  const match = await client().getMatch(pubobotMatch.matchId).then(verifySingleResult);
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
    client().upsertMatchPlayers(team1.map(toMatchPlayer(match.id, 1, ratings || []))),
    client().upsertMatchPlayers(team2.map(toMatchPlayer(match.id, 2, ratings || []))),
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

export function getUserIds(embed: Embed, name: string) {
  return (
    embed.fields
      ?.find((field) => field.name.includes(name))
      ?.value.match(/(?<=<@)\d+(?=>)/g) || []
  );
}

export const getUserNames = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=`)([^`\n]+)(?=`)/g) || [];

export async function startTopLocationPoll(
  match: MatchesJoined,
  message: Message
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const pollEndTime = DateTime.now().plus({ seconds: 30 });

    const pollMessage = await message.channel.send({
      embeds: [
        { fields: [createServerLocationPollField(pollEndTime), getMatchField(match)] },
      ],
    });
    logMessage(`Channel ${message.channel.id}: Poll created for Match ${match.id}`, {
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
            {
              fields: [
                createServerLocationPollResultField(locationName),
                getMatchField(match),
              ],
            },
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
