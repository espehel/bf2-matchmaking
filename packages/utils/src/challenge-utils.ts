import { AcceptedChallenge, MatchesJoined } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';

export function buildRaidOrganizerCommand(
  match: MatchesJoined,
  challenge: AcceptedChallenge
) {
  const title = `title:${match.config.type} Challenge: ${challenge.home_team.name} vs. ${challenge.away_team.name}`;
  const eventStart = `event_start:${DateTime.fromISO(challenge.scheduled_at).toFormat(
    'dd.MM.yyyy HH:mm'
  )}`;
  const template = 'template:3 - 8v8';

  const awayServer =
    challenge.away_server.ip !== challenge.home_server.ip
      ? ` + ${challenge.away_server.name}`
      : '';
  const description = `description:${challenge.home_map.name} + ${challenge.away_map.name} | ${challenge.home_server.name}${awayServer}`;

  return `/event create ${title} ${eventStart} ${template} ${description}`;
}
