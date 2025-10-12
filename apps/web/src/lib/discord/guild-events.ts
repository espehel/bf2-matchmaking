import { createScheduledMatchEvent } from '@bf2-matchmaking/discord/events';
import { postGuildScheduledEvent } from '@bf2-matchmaking/discord/rest';
import { ScheduledMatch } from '@bf2-matchmaking/types';
import { assertString } from '@bf2-matchmaking/utils';

export function createGuildEvent(match: ScheduledMatch) {
  assertString(match.config.guild, 'Match config is missing guild');
  return postGuildScheduledEvent(match.config.guild, createScheduledMatchEvent(match));
}
