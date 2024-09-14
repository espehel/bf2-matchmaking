import {
  PollResult,
  MatchesJoined,
  PollEmoji,
  PickedMatchPlayer,
  MatchConfigsRow,
  PubobotMatch,
} from '@bf2-matchmaking/types';
import { Message, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import {
  buildDraftPollEmbed,
  buildDraftPollEndedEmbed,
  buildDebugDraftEndedEmbed,
} from '@bf2-matchmaking/discord';
import { info, logMessage } from '@bf2-matchmaking/logging';
import { sendLogMessage, sendMessage } from './services/message-service';
import { wait } from '@bf2-matchmaking/utils';
import { MessagePoll } from './MessagePoll';
import { isTeam } from '@bf2-matchmaking/utils';
import {
  buildPubotDraftWithConfig,
  getUnpickList,
  VALID_DRAFT_CONFIGS,
} from '../../src/discord/services/draft-service';

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
  channel: TextChannel,
  message: Message,
  pubobotMatch: PubobotMatch,
  match: MatchesJoined,
  configOption?: MatchConfigsRow
) {
  if (!VALID_DRAFT_CONFIGS.includes(match.config.id)) {
    info('createDraftPoll', `Invalid draft config ${match.config.name}`);
    return null;
  }

  const config = configOption || match.config;

  const pickList = await buildPubotDraftWithConfig(match, config);
  // TODO this should be updated after new messages, maybe add to redis?
  const unpickList = getUnpickList(message);
  if (!pickList) {
    return;
  }

  info('createDraftPoll', `Match ${match.id} pick list created, creating poll...`);

  const pollEndTime = DateTime.now().plus({ minutes: 2 });
  const poll = await MessagePoll.createPoll(channel, {
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
    .onPollEnd(handlePollEnd(channel, pickList, unpickList, pubobotMatch, match, config))
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
  channel: TextChannel,
  pickList: Array<PickedMatchPlayer>,
  unpickList: Array<string>,
  pubobotMatch: PubobotMatch,
  match: MatchesJoined,
  config: MatchConfigsRow
) {
  return async (results: Array<PollResult>) => {
    //TODO should fetch updated pubobotmatch here, possibly contianing updated unpick list
    const isAccepted = isDraftPollResolvedWithAccept(results, pickList);

    await sendLogMessage({
      embeds: [buildDebugDraftEndedEmbed(match.id, config.name, results, isAccepted)],
    });

    if (isAccepted) {
      await handleDraftAccepted(channel, pubobotMatch, match, pickList, unpickList);
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
  channel: TextChannel,
  pubobotMatch: PubobotMatch,
  match: MatchesJoined,
  pickList: Array<PickedMatchPlayer>,
  unpickList: Array<string>
) {
  logMessage(`Match ${match.id}: Executing suggested draft`, {
    pubobotMatch,
    match,
    unpickList,
    pickList,
  });

  for (const playerId of unpickList) {
    await sendMessage(channel, `!put <@${playerId}> Unpicked ${pubobotMatch.id}`);
    await wait(1);
  }

  for (const mp of pickList) {
    await sendMessage(
      channel,
      `!put <@${mp.player_id}> ${mp.team === 1 ? 'USMC' : 'MEC/PLA'} ${pubobotMatch.id}`
    );
    await wait(1);
  }
}

export function compareMessageReactionResults(resA: PollResult, resB: PollResult) {
  return resB[1].length - resA[1].length;
}

function getTeamCount(
  voters: Array<string>,
  players: Array<PickedMatchPlayer>,
  team: 1 | 2
) {
  const teamPlayers = players.filter(isTeam(team)).map((mp) => mp.player_id);
  return voters.filter((voter) => teamPlayers.includes(voter)).length;
}
