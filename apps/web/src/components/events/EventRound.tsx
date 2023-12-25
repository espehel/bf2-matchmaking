import {
  EventMatchesRow,
  EventRoundsRow,
  EventsJoined,
  isDefined,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import React from 'react';
import AddMatchForm from '@/components/events/AddMatchForm';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { deleteEventMatch, deleteEventRound } from '@/app/events/[event]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';
import Link from 'next/link';

interface Props {
  event: EventsJoined;
  round: EventRoundsRow & { matches: Array<EventMatchesRow> };
  edit: boolean;
}

export default function EventRound({ event, round, edit }: Props) {
  const matches = round.matches
    .map((em) => {
      const m = event.matches.find((m) => m.id === em.match);
      return m && { ...m, ...em };
    })
    .filter(isDefined);

  async function deleteEventRoundSA() {
    'use server';
    return await deleteEventRound(round);
  }

  function deleteEventMatchSA(match: EventMatchesRow) {
    return async () => {
      'use server';
      return deleteEventMatch(match);
    };
  }

  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center justify-end border-b-2 border-primary">
        <h3 className="font-bold mr-auto">{round.label}</h3>
        <p>{DateTime.fromISO(round.start_at).toFormat('EEEE, DD')}</p>
        <ActionWrapper
          action={deleteEventRoundSA}
          successMessage="Round deleted"
          errorMessage="Failed to delete round"
          visible={edit}
        >
          <IconBtn Icon={XCircleIcon} size="xs" className="text-error" />
        </ActionWrapper>
      </div>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li key={match.id} className="flex items-center justify-end">
            <Link className="link link-hover mr-auto" href={`/matches/${match.id}`}>
              {match.id} - {match.home_team.name} v. {match.away_team.name}
            </Link>
            <Badge home={match.home_accepted} away={match.away_accepted} />
            <ActionWrapper
              action={deleteEventMatchSA(match)}
              successMessage="Match deleted"
              errorMessage="Failed to delete match"
              visible={edit}
            >
              <IconBtn Icon={XCircleIcon} size="sm" className="text-error" />
            </ActionWrapper>
          </li>
        ))}
      </ul>
      {edit && <AddMatchForm event={event} round={round} />}
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
