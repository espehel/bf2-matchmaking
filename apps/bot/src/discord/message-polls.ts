import {
  isNotNull,
  LocationEmoji,
  PollResult,
  MatchesJoined,
  PollEmoji,
  PickedMatchPlayer,
  MatchConfigsRow,
} from '@bf2-matchmaking/types';
import { Message, MessageReaction, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import {
  buildDraftPollEmbed,
  createServerLocationPollField,
  getMatchField,
  buildDraftPollEndedEmbed,
  buildDebugDraftEndedEmbed,
} from '@bf2-matchmaking/discord';
import { info, logMessage } from '@bf2-matchmaking/logging';
import {
  getServerLocation,
  getServerLocationEmojis,
  getValidEmojis,
} from '../services/location-service';
import {
  editLocationPollMessageWithResults,
  replyMessage,
  sendLogMessage,
} from '../services/message-service';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
import { MessagePoll } from './MessagePoll';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';
import {
  buildPubotDraftWithConfig,
  getUnpickList,
  VALID_DRAFT_CONFIGS,
} from '../services/draft-service';
import { getPubobotId } from '../services/pubobot-service';

let polls: Array<[number, MessagePoll]> = [];
function addPoll(matchId: number, poll: MessagePoll) {
  info('addPoll', `Adding poll for match ${matchId}`);
  polls.push([matchId, poll]);
}
function stopPolls(matchId: number) {
  info('stopPolls', `Stopping polls for match ${matchId}`);
  polls
    .filter(([id]) => id === matchId)
    .forEach(([, poll]) => poll.stopPoll(`Polls for match ${matchId} is resolved`));
}

function removePolls(matchId: number) {
  info('removePolls', `Removing polls for match ${matchId}`);
  polls = polls.filter(([id]) => id !== matchId);
}

export async function createDraftPoll(
  message: Message,
  match: MatchesJoined,
  configOption?: MatchConfigsRow
) {
  if (!VALID_DRAFT_CONFIGS.includes(match.config.id)) {
    info('createDraftPoll', `Invalid draft config ${match.config.name}`);
    return null;
  }

  const config = configOption || match.config;

  const pickList = await buildPubotDraftWithConfig(match, config);
  if (!pickList) {
    return;
  }

  info('createDraftPoll', `Match ${match.id} pick list created, creating poll...`);

  const pollEndTime = DateTime.now().plus({ minutes: 2 });
  const poll = await MessagePoll.createPoll(message.channel as TextChannel, {
    embeds: [
      buildDraftPollEmbed(match, pickList.flat(), match.players, null, pollEndTime),
    ],
  });
  addPoll(match.id, poll);
  info('createDraftPoll', `Match ${match.id} Poll created`);

  await poll
    .setEndtime(pollEndTime)
    .setValidUsers(new Set(pickList.map((p) => p.player_id)))
    .onReaction(handleDraftPollReaction(pickList, match, pollEndTime))
    .onPollEnd(handlePollEnd(message, pickList, match, config))
    .startPoll();
  info('createDraftPoll', `Match ${match.id} Poll started`);

  logMessage(`Match ${match.id}: Draft poll started`, {
    match,
    pickList,
  });
}

function handleDraftPollReaction(
  pickList: Array<PickedMatchPlayer>,
  match: MatchesJoined,
  pollEndTime: DateTime
) {
  return (results: Array<PollResult>) => {
    if (isDraftPollResolvedWithAccept(results, pickList)) {
      stopPolls(match.id);
    }
    return {
      embeds: [
        buildDraftPollEmbed(match, pickList.flat(), match.players, results, pollEndTime),
      ],
    };
  };
}
function handlePollEnd(
  message: Message,
  pickList: Array<PickedMatchPlayer>,
  match: MatchesJoined,
  config: MatchConfigsRow
) {
  return async (results: Array<PollResult>) => {
    const isAccepted = isDraftPollResolvedWithAccept(results, pickList);

    await sendLogMessage({
      embeds: [buildDebugDraftEndedEmbed(match.id, config.name, results, isAccepted)],
    });

    if (isAccepted) {
      await handleDraftAccepted(message, match, pickList);
      info('createDraftPoll', `Match ${match.id} Draft executed`);
    }

    logMessage(`Match ${match.id}: Poll ended`, {
      pubMatch: match,
      pickList,
      results,
      isAccepted,
    });

    removePolls(match.id);

    return {
      embeds: [
        buildDraftPollEndedEmbed(
          match,
          pickList.flat(),
          match.players,
          results,
          isAccepted
        ),
      ],
    };
  };
}

function isDraftPollResolvedWithAccept(
  results: Array<PollResult>,
  pickList: Array<PickedMatchPlayer>
) {
  const acceptResult = results.find(([reaction]) => reaction === PollEmoji.ACCEPT);
  if (!acceptResult) {
    return false;
  }
  const voteThreshold = Math.floor(pickList.length / 4) || 1;
  const [, votes] = acceptResult;
  return (
    getTeamCount(votes, pickList, 1) >= voteThreshold &&
    getTeamCount(votes, pickList, 2) >= voteThreshold
  );
}

export async function handleDraftAccepted(
  message: Message,
  match: MatchesJoined,
  pickList: Array<PickedMatchPlayer>
) {
  const pubobotMatchId = getPubobotId(message);
  const unpickList = getUnpickList(message);

  logMessage(`Match ${match.id}: Executing suggested draft`, {
    pubobotMatchId,
    match: match,
    unpickList,
    pickList,
  });

  for (const playerId of unpickList) {
    await replyMessage(message, `!put <@${playerId}> Unpicked ${pubobotMatchId}`);
    await wait(1);
  }

  for (const mp of pickList) {
    await replyMessage(
      message,
      `!put <@${mp.player_id}> ${mp.team === 1 ? 'USMC' : 'MEC/PLA'} ${pubobotMatchId}`
    );
    await wait(1);
  }
}

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
    await pollMessage.react(LocationEmoji.Existing);

    setTimeout(async () => {
      const results = pollMessage.reactions.cache
        .map(toResults(getValidEmojis()))
        .filter(isNotNull)
        .sort(compareMessageReactionResultsOld(match.players.map((p) => p.id)));

      if (!results.length) {
        return reject('Unable to get results');
      }

      const location = getServerLocation(results[0][0]);
      if (!location) {
        return reject('Unable to get location');
      }

      await editLocationPollMessageWithResults(pollMessage, match, results);
      resolve(location);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}
export function toResults(validEmojis: Array<LocationEmoji | PollEmoji>) {
  return (reaction: MessageReaction): PollResult | null => {
    if (reaction.emoji.name && validEmojis.some((k) => k === reaction.emoji.name)) {
      return [reaction.emoji.name, Array.from(reaction.users.cache.keys())];
    } else {
      return null;
    }
  };
}

export function compareMessageReactionResults(resA: PollResult, resB: PollResult) {
  return resB[1].length - resA[1].length;
}
export function compareMessageReactionResultsOld(players: Array<string>) {
  return ([, votesA]: PollResult, [, votesB]: PollResult) =>
    getValidUsersCount(votesB, players) - getValidUsersCount(votesA, players);
}

function getValidUsersCount(users: Array<string>, matchPlayers: Array<string>) {
  return users.filter((user) => matchPlayers.includes(user)).length;
}

function getTeamCount(
  voters: Array<string>,
  players: Array<PickedMatchPlayer>,
  team: 1 | 2
) {
  const teamPlayers = players.filter(isTeam(team)).map((mp) => mp.player_id);
  return voters.filter((voter) => teamPlayers.includes(voter)).length;
}
