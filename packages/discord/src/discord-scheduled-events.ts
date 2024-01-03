import { MatchesJoined, ScheduledMatch, ServersRow } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import { api } from '@bf2-matchmaking/utils';
import { RESTPostAPIGuildScheduledEventJSONBody } from 'discord-api-types/v10';
import { matchthumb } from '../resources/matchthumb-base64';
import { pcwthumb } from '../resources/pcwthumb-base64';
import { getMatchThumbnail } from './discord-services';

export function createScheduledMatchEvent(
  match: ScheduledMatch,
  serverName: string
): RESTPostAPIGuildScheduledEventJSONBody {
  const name = `${match.config.type}: ${match.home_team.name} vs. ${match.away_team.name}`;
  const description = getMatchDescription(match, null, serverName);
  const scheduled_start_time = match.scheduled_at;
  const scheduled_end_time =
    DateTime.fromISO(match.scheduled_at).plus({ hours: 2 }).toISO() || undefined;
  const entity_type = 3;
  const image = `data:image/jpeg;base64,${getMatchThumbnail(match)}`;
  const entity_metadata = { location: `${api.web().basePath}/matches/${match.id}` };

  return {
    name,
    description,
    scheduled_start_time,
    scheduled_end_time,
    entity_type,
    entity_metadata,
    image,
    privacy_level: 2,
  };
}

export const getMatchDescription = (
  match: MatchesJoined,
  server: ServersRow | null | undefined,
  serverName: string
) => {
  const mapText = match.maps.length ? match.maps.map((m) => m.name).join(', ') : 'TBD';
  const serverText = server?.name || serverName;
  return `Maps: ${mapText} | Server: ${serverText}`;
};
