import { getDiscordClient } from '../client';
import { GuildScheduledEvent } from 'discord.js';
import { createScheduledMatch } from '../match-service';
import { error, logErrorMessage } from '@bf2-matchmaking/logging';

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
const recordedEvents: Array<string> = [];
export async function initScheduledEventsListener() {
  const discordClient = await getDiscordClient();
  discordClient.on(
    'guildScheduledEventCreate',
    async (guildScheduledEvent: GuildScheduledEvent) => {
      if (recordedEvents.includes(guildScheduledEvent.id)) {
        error('initScheduledEventsListener', 'Aborting due to duplicated event');
        return;
      }
      recordedEvents.push(guildScheduledEvent.id);

      const startTime = guildScheduledEvent.scheduledStartTimestamp;
      if (!startTime) {
        error('initScheduledEventsListener', 'Aborting due to no startTime');
        return;
      }

      const config = getMatchConfig(guildScheduledEvent);
      if (!config) {
        error('initScheduledEventsListener', 'Aborting due to no config');
        return;
      }

      const [teamString, mapString, serverString] =
        guildScheduledEvent?.description?.split('|') || Array.from({ length: 3 });

      const [home_team, away_team] = getMatchTeams(teamString);
      if (!home_team || !away_team) {
        error('initScheduledEventsListener', 'Aborting due to missing team');
        return;
      }

      const maps = mapString?.split('+').map((m) => m.trim()) || [];

      const server = serverString.split('Server: ')[1] || null;

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
        error('initScheduledEventsListener', e);
        logErrorMessage('Failed to create scheduled match', e);
      }
    }
  );
}
