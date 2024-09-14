import { GuildScheduledEvent } from 'discord.js';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';
import { createScheduledMatch } from './services/supabase-service';
import { discordClient } from './client';

const recordedEvents: Array<string> = [];
export function initScheduledEventsListener() {
  discordClient.on('guildScheduledEventCreate', handleScheduledEvent);
  info('initScheduledEventsListener', 'Listening for scheduled events');
}

async function handleScheduledEvent(guildScheduledEvent: GuildScheduledEvent) {
  if (guildScheduledEvent.creatorId !== '736116031772164128') {
    info(
      'handleScheduledEvent',
      `Discarding non-raid organizer events. User: ${guildScheduledEvent.creator?.username} - ${guildScheduledEvent.creatorId}`
    );
    return;
  }

  if (recordedEvents.includes(guildScheduledEvent.id)) {
    info('handleScheduledEvent', 'Aborting due to duplicated event');
    return;
  }

  recordedEvents.push(guildScheduledEvent.id);
  const startTime =
    guildScheduledEvent.scheduledStartTimestamp !== null
      ? DateTime.fromMillis(guildScheduledEvent.scheduledStartTimestamp).toISO()
      : null;
  if (!startTime) {
    info('handleScheduledEvent', 'Aborting due to no startTime');
    return;
  }

  const config = getMatchConfig(guildScheduledEvent);
  if (!config) {
    info('handleScheduledEvent', 'Aborting due to no config');
    return;
  }

  const [teamString, mapString, serverString] =
    guildScheduledEvent?.description?.split('|') || Array.from({ length: 3 });

  const [home_team, away_team] = getMatchTeams(teamString);
  if (!home_team || !away_team) {
    info('handleScheduledEvent', 'Aborting due to missing team');
    return;
  }

  const maps = mapString?.split('+').map((m) => m.trim()) || [];

  const server = serverString?.split('Server: ')[1] || null;

  try {
    await createScheduledMatch({
      config,
      home_team,
      away_team,
      maps,
      server,
      startTime,
    });
  } catch (e) {
    logErrorMessage('Failed to create scheduled match', e);
  }
}

function getMatchConfig(guildScheduledEvent: GuildScheduledEvent) {
  if (guildScheduledEvent.name.toLocaleLowerCase().includes('match')) {
    return 16;
  }
  if (guildScheduledEvent.name.toLocaleLowerCase().includes('pcw')) {
    return 15;
  }
  return null;
}

function getMatchTeams(teamString: string | undefined): [string | null, string | null] {
  const regExp = /<@&(\d+)>/g;
  const result = teamString ? [...teamString.matchAll(regExp)] : null;

  if (result && result.length === 2) {
    return [result[0][1], result[1][1]];
  }

  return [null, null];
}
