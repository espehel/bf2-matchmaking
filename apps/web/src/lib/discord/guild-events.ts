import {
  createScheduledMatchEvent,
  getMatchDescription,
} from '@bf2-matchmaking/discord/events';
import {
  patchGuildScheduledEvent,
  postGuildScheduledEvent,
} from '@bf2-matchmaking/discord/rest';
import { MatchesJoined, MatchServers, ScheduledMatch } from '@bf2-matchmaking/types';
import { assertString } from '@bf2-matchmaking/utils';
import { matches } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

export function createGuildEvent(match: ScheduledMatch) {
  assertString(match.config.guild, 'Match config is missing guild');
  return postGuildScheduledEvent(match.config.guild, createScheduledMatchEvent(match));
}

export async function updateGuildEventDescription(matchId: number) {
  const servers = await matches.servers.get(matchId).then(verifySingleResult);
  const match = await matches.getJoined(matchId).then(verifySingleResult);

  if (!match.config.guild || !match.discord_event) {
    return null;
  }
  return patchGuildScheduledEvent(match.config.guild, match.discord_event, {
    description: getMatchDescription(match, servers?.servers),
  });
}
