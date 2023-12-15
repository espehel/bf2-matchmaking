import {
  EventMatchesRow,
  EventRoundsRow,
  EventsJoined,
  isDefined,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import React from 'react';
import AddMatchForm from '@/components/events/AddMatchForm';

interface Props {
  event: EventsJoined;
  round: EventRoundsRow & { matches: Array<EventMatchesRow> };
}

export default function EventRound({ event, round }: Props) {
  const matches = round.matches
    .map(({ match, home_accepted, away_accepted }) => {
      const m = event.matches.find((m) => m.id === match);
      return m && { ...m, home_accepted, away_accepted };
    })
    .filter(isDefined);

  return (
    <section className="flex flex-col gap-1">
      <div className="flex justify-between border-b-2 border-primary">
        <h3>{round.label}</h3>
        <p>{DateTime.fromISO(round.start_at).toFormat('EEEE, DD')}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li key={match.id} className="flex justify-between">
            <div>
              {match.home_team.name} v. {match.away_team.name}
            </div>
            <Badge home={match.home_accepted} away={match.away_accepted} />
          </li>
        ))}
      </ul>
      <AddMatchForm event={event} round={round} />
    </section>
  );
}

function Badge({ home, away }: { home: boolean; away: boolean }) {
  return home && away ? (
    <div className="badge badge-success">Confirmed</div>
  ) : (
    <div className="badge badge-warning">Unconfirmed</div>
  );
}
