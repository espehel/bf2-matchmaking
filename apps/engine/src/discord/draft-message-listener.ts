import { getOpenMatchDrafts } from '@bf2-matchmaking/redis/matches';
import { discordClient } from './client';
import { isTextBasedChannel } from './discord-utils';
import { MatchdraftsRow } from '@bf2-matchmaking/schemas/types';
import { MessageReaction, ReactionManager, User } from 'discord.js';
import { addMatchPlayer, setMatchPlayers } from './services/supabase-service';
import { error, info } from '@bf2-matchmaking/logging';

interface MessageMatchDraft extends MatchdraftsRow {
  sign_up_message: string;
  sign_up_channel: string;
}

function isMessageMatchDraft(draft: MatchdraftsRow): draft is MessageMatchDraft {
  return (
    typeof draft.sign_up_message === 'string' && typeof draft.sign_up_channel === 'string'
  );
}

async function loadMessages() {
  const drafts = await getOpenMatchDrafts();
  return Promise.all(drafts.filter(isMessageMatchDraft).map(listenToMessage));
}
export function initDraftMessageListeners() {
  loadMessages().then((result) => {
    result.forEach(([matchId, status]) => {
      if (status === 'OK') {
        console.log(`Listening to draft message for match ${matchId}`);
      } else {
        console.error(
          `Failed to listen to draft message for match ${matchId}: ${status}`
        );
      }
    });
  });
}

export async function listenToMessage(draft: MessageMatchDraft) {
  try {
    const channel = await discordClient.channels.fetch(draft.sign_up_channel);
    if (!isTextBasedChannel(channel)) {
      return [draft.match_id, 'invalid channel'];
    }
    const message = await channel.messages.fetch(draft.sign_up_message);
    const attending = await getCurrentReactions('✅', message.reactions);
    //const maybe = await getCurrentReactions('❔', message.reactions);

    await setMatchPlayers(attending, draft.match_id);

    message
      .createReactionCollector({
        filter: reactionFilter,
        dispose: true,
      })
      .on('collect', async (reaction: MessageReaction, user: User) => {
        if (!user.bot && reaction.emoji.name === '✅') {
          await addMatchPlayer(user, draft.match_id);
        }
      })
      .on('remove', async (reaction: MessageReaction, user: User) => {
        if (!user.bot && reaction.emoji.name === '✅') {
          await addMatchPlayer(user, draft.match_id);
        }
      });
    return [draft.match_id, 'OK'];
  } catch (err) {
    error('listenToMessage', err);
    return [draft.match_id, 'error'];
  }
}

async function getCurrentReactions(emoji: string, reactions: ReactionManager) {
  const reaction = reactions.cache.find((r) => r.emoji.name === emoji);
  if (!reaction) {
    return [];
  }
  return reaction.users.fetch().then((users) => Array.from(users.values()));
}

function reactionFilter(reaction: MessageReaction): boolean {
  return reaction.emoji.name ? ['✅', '❔'].includes(reaction.emoji.name) : false;
}
