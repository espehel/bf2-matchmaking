import { ScheduledMatch } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import { api, getMatchType } from '@bf2-matchmaking/utils';
import { GuildScheduledEventCreateOptions } from '@bf2-matchmaking/types/src/discordjs';

export function createScheduledMatchEvent(
  match: ScheduledMatch
): GuildScheduledEventCreateOptions {
  const name = `${getMatchType(match)}${match.home_team.name} vs. ${
    match.away_team.name
  }`;
  const description = getMatchDescription(match);
  const scheduledStartTime = match.scheduled_at;
  const scheduledEndTime =
    DateTime.fromISO(match.scheduled_at).plus({ hours: 2 }).toISO() || undefined;
  const entityType = 3;
  const image =
    match.config.id === 16
      ? 'https://cdn.discordapp.com/attachments/1017421174545862748/1161351076633661510/matchthumb.jpg'
      : 'https://cdn.discordapp.com/attachments/1017421174545862748/1161351076159688794/pcwthumb.jpg';
  const entityMetadata = { location: `${api.web().basePath}/matches/${match.id}` };

  return {
    name,
    description,
    scheduledStartTime,
    scheduledEndTime,
    entityType,
    entityMetadata,
    image,
    privacyLevel: 2,
  };
}

const getMatchDescription = (match: ScheduledMatch) => {
  const mapText = match.maps.length ? match.maps.map((m) => m.name).join(', ') : 'TBD';
  const serverText = match.server?.name || 'TBD';
  return `Maps: ${mapText} | Server: ${serverText}`;
};
