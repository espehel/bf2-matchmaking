import {
  isNotNull,
  LocationEmoji,
  PollResult,
  MatchesJoined,
  PollEmoji,
  PickedMatchPlayer,
  MatchConfigsRow,
} from '@bf2-matchmaking/types';
import { Message, MessageReaction } from 'discord.js';
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
  sendLogMessage,
  sendMessage,
} from '../services/message-service';
import { PubobotMatch } from '../services/PubobotMatch';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
import { MessagePoll } from './MessagePoll';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';
import { buildDraftWithConfig, getUnpickList } from '../services/draft-service';

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
  pubMatch: PubobotMatch,
  configOption?: MatchConfigsRow
) {
  const config = configOption || pubMatch.match.config;

  const pickList = await buildDraftWithConfig(pubMatch, config);
  if (!pickList) {
    return;
  }

  info('createDraftPoll', `Pubmatch ${pubMatch.id} pick list created, creating poll...`);

  const pollEndTime = DateTime.now().plus({ minutes: 2 });
  const poll = await MessagePoll.createPoll(pubMatch.getChannel(), {
    embeds: [
      buildDraftPollEmbed(
        pubMatch.match,
        pickList.flat(),
        pubMatch.players,
        null,
        pollEndTime
      ),
    ],
  });
  addPoll(pubMatch.match.id, poll);
  info('createDraftPoll', `Pubmatch ${pubMatch.id} Poll created`);

  await poll
    .setEndtime(pollEndTime)
    .setValidUsers(new Set(pickList.map((p) => p.player_id)))
    .onReaction(handleDraftPollReaction(pickList, pubMatch, pollEndTime))
    .onPollEnd(handlePollEnd(pickList, pubMatch, config))
    .startPoll();
  info('createDraftPoll', `Pubmatch ${pubMatch.id} Poll started`);

  logMessage(`Match ${pubMatch.match.id}: Draft poll started`, {
    pubMatch,
    pickList,
  });
}

function handleDraftPollReaction(
  pickList: Array<PickedMatchPlayer>,
  pubMatch: PubobotMatch,
  pollEndTime: DateTime
) {
  return (results: Array<PollResult>) => {
    if (isDraftPollResolvedWithAccept(results, pickList)) {
      stopPolls(pubMatch.match.id);
    }
    return {
      embeds: [
        buildDraftPollEmbed(
          pubMatch.match,
          pickList.flat(),
          pubMatch.players,
          results,
          pollEndTime
        ),
      ],
    };
  };
}
function handlePollEnd(
  pickList: Array<PickedMatchPlayer>,
  pubMatch: PubobotMatch,
  config: MatchConfigsRow
) {
  return async (results: Array<PollResult>) => {
    const isAccepted = isDraftPollResolvedWithAccept(results, pickList);

    await sendLogMessage({
      embeds: [buildDebugDraftEndedEmbed(pubMatch.id, config.name, results, isAccepted)],
    });

    if (isAccepted) {
      await handleDraftAccepted(pubMatch, pickList);
      info('createDraftPoll', `Pubmatch ${pubMatch.id} Draft executed`);
    }

    logMessage(`Match ${pubMatch.match.id}: Poll ended`, {
      pubMatch,
      pickList,
      results,
      isAccepted,
    });

    removePolls(pubMatch.match.id);

    return {
      embeds: [
        buildDraftPollEndedEmbed(
          pubMatch.match,
          pickList.flat(),
          pubMatch.players,
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
  pubMatch: PubobotMatch,
  pickList: Array<PickedMatchPlayer>
) {
  const unpickList = getUnpickList(pubMatch);

  logMessage(`Match ${pubMatch.match.id}: Executing suggested draft`, {
    PubobotMatch: pubMatch.id,
    match: pubMatch.match,
    unpickList,
    pickList,
  });

  for (const playerId of unpickList) {
    await sendMessage(
      pubMatch.getChannel(),
      `!put <@${playerId}> Unpicked ${pubMatch.id}`
    );
    await wait(1);
  }

  for (const mp of pickList) {
    await sendMessage(
      pubMatch.getChannel(),
      `!put <@${mp.player_id}> ${mp.team === 1 ? 'USMC' : 'MEC/PLA'} ${pubMatch.id}`
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
