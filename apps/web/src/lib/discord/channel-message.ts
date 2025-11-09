import { sendChannelMessage } from '@bf2-matchmaking/discord/rest';
import {
  DiscordMatch,
  EventMatchesRow,
  EventRoundsRow,
  EventsJoined,
  EventsRound,
  EventsRoundMatch,
} from '@bf2-matchmaking/types';
import { cookies } from 'next/headers';
import { supabase } from '../supabase/supabase-server';
import { logErrorMessage } from '@bf2-matchmaking/logging/logtail';
import { DateTime } from 'luxon';
import { api, assertString } from '@bf2-matchmaking/utils';
import { web } from '@bf2-matchmaking/utils/url-builder';

export async function sendMatchTimeAcceptedMessage(match: DiscordMatch) {
  const cookieStore = await cookies();
  const { data: eventRound } = await supabase(cookieStore).getEventRoundByMatchId(
    match.id
  );

  const { error } = await sendChannelMessage(match.config.channel, {
    content: `**${eventRound?.label}** [${match.home_team.name} v ${match.away_team.name}}]: Match time accepted by both teams`,
  });

  if (error) {
    logErrorMessage('Failed to send match time accepted message', error, { match });
  }
}

export async function sendMatchTimeProposedMessage(match: DiscordMatch, team: string) {
  assertString(match.scheduled_at, 'match.scheduled_at is not defined');

  const cookieStore = await cookies();
  const { data: eventMatch, error } = await supabase(cookieStore).getEventMatch(match.id);
  if (error) {
    logErrorMessage(
      'Failed to send match time proposed message, no event round found',
      error,
      { match }
    );
    return;
  }

  const proposedTime = DateTime.fromISO(match.scheduled_at).toFormat(
    'HH:mm - EEEE, MMM d'
  );

  const res = await sendChannelMessage(match.config.channel, {
    content: `**${eventMatch.round.label}** [${match.home_team.name} v ${match.away_team.name}]: **${team}** proposed new match time: ${proposedTime}. [Please accept or propose a new time.](${web.matchPage(match.id)})`,
  });

  if (res.error) {
    logErrorMessage('Failed to send match time accepted message', res.error, { match });
  }
}

function buildAnnounceEventMatchField(
  timestamp: string,
  roundMatches: Array<EventsRoundMatch>
) {
  let matchTime = DateTime.fromISO(timestamp, { zone: 'Europe/Paris', locale: 'en-GB' });
  const timeZone = matchTime.offsetNameShort;

  const matchesValues = roundMatches.map(
    ({ match, home_accepted, away_accepted }) =>
      `[${match.home_team.name} v ${match.away_team.name}](${web.matchPage(match.id)}) (${home_accepted && away_accepted ? 'confirmed' : 'unconfirmed'})`
  );

  return {
    name: `${matchTime.toFormat('EEEE, HH:mm')} ${timeZone}`,
    value: matchesValues.join('\n'),
  };
}

export async function sendAnnounceEventRoundMessage(round: EventsRound, channel: string) {
  const matchEntries = round.event_matches.reduce<Record<string, EventsRoundMatch[]>>(
    (acc, cur) => {
      if (!cur.match.scheduled_at) {
        return acc;
      }
      if (acc[cur.match.scheduled_at]) {
        acc[cur.match.scheduled_at].push(cur);
      } else {
        acc[cur.match.scheduled_at] = [cur];
      }
      return acc;
    },
    {}
  );
  return sendChannelMessage(channel, {
    embeds: [
      {
        title: `${round.event.name} - ${round.label}`,
        fields: [
          ...Object.entries(matchEntries).map(([timestamp, rm]) =>
            buildAnnounceEventMatchField(timestamp, rm)
          ),
        ],
        url: `${web.eventPage(round.event.id)}`,
      },
    ],
  });
}
