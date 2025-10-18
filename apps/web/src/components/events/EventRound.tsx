import {
  EventMatchesRow,
  EventRoundsRow,
  EventsJoined,
  EventsMatch,
  isDefined,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import React, { Suspense } from 'react';
import AddMatchForm from '@/components/events/AddMatchForm';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import {
  announceRound,
  confirmEventMatch,
  deleteEventMatch,
  deleteEventRound,
} from '@/app/events/[event]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';
import Link from 'next/link';
import ActionButton from '../commons/action/ActionButton';
import { CheckIcon } from '@heroicons/react/20/solid';
import { matches, results } from '@/lib/supabase/supabase-server';
import { calculateLeaguePoints } from '@bf2-matchmaking/utils';
import Time from '../commons/Time';

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

  function confirmEventMatchSA(match: EventMatchesRow) {
    return async () => {
      'use server';
      return confirmEventMatch(match);
    };
  }

  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center justify-end border-b-2 border-primary">
        <h3 className="font-bold">{round.label}</h3>
        <ActionButton
          action={announceRound}
          input={{ eventId: event.id, roundId: round.id }}
          size="sm"
          kind="ghost"
        >
          Announce
        </ActionButton>
        <input type="checkbox" className=" mr-auto" />
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
              {match.home_team.name} v. {match.away_team.name}
            </Link>
            <Suspense fallback={<div className="badge invisible" />}>
              <MatchBadge eventMatch={match} />
            </Suspense>
            <ActionWrapper
              action={confirmEventMatchSA(match)}
              successMessage="Match time confirmed"
              errorMessage="Failed to confirm match time"
              visible={edit && !isConfirmed(match)}
            >
              <IconBtn Icon={CheckIcon} size="sm" className="text-success" />
            </ActionWrapper>
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

async function MatchBadge({ eventMatch }: { eventMatch: EventMatchesRow & EventsMatch }) {
  const { data: match } = await matches.get(eventMatch.match);
  const { data: result } = await results.getByMatchId(eventMatch.match);
  const home = result?.find((r) => r.team.id === eventMatch.home_team.id);
  const away = result?.find((r) => r.team.id === eventMatch.away_team.id);

  if (home && away) {
    const [homePoints, awayPoints] = calculateLeaguePoints(home, away);
    return <div className="badge badge-info">{`${homePoints} - ${awayPoints}`}</div>;
  }

  if (!eventMatch.home_accepted || !eventMatch.away_accepted) {
    return <div className="badge badge-warning">Unconfirmed</div>;
  }

  if (match?.scheduled_at) {
    return (
      <div className="badge badge-success">
        <Time date={match.scheduled_at} format="HH:mm - EEEE, MMMM d" />
      </div>
    );
  }

  return <div className="badge badge-success">Confirmed</div>;
}

function isConfirmed(eventMatch: EventMatchesRow) {
  return eventMatch.home_accepted && eventMatch.away_accepted;
}
