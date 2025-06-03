import { EventMatchesRow, MatchesJoined } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import React from 'react';
import { BellAlertIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import DatetimeInput from '@/components/commons/DatetimeInput';
import ActionFormModal from '@/components/commons/ActionFormModal';
import { acceptMatchTime, updateMatchScheduledAt } from '@/app/matches/[match]/actions';
import ActionButton from '@/components/ActionButton';

interface Props {
  match: MatchesJoined;
}

export default async function MatchTimeForm({ match }: Props) {
  if (
    !match.scheduled_at ||
    match.config.type === 'Mix' ||
    match.config.type === 'Ladder'
  ) {
    return <MatchTimeFallback match={match} />;
  }

  const cookieStore = await cookies();
  const { data: eventMatch } = await supabase(cookieStore).getEventMatch(match.id);

  async function updateMatchScheduledAtSA(data: FormData) {
    'use server';
    return updateMatchScheduledAt(match.id, data);
  }

  if (!eventMatch) {
    return (
      <div className="flex gap-2 items-center text-gray font-bold mb-2">
        <Time date={match.scheduled_at} format="HH:mm - EEEE, MMMM d" />
        <ActionFormModal
          title="Change time"
          openBtnLabel="Change time"
          action={updateMatchScheduledAtSA}
          errorMessage="Something went wrong"
          successMessage="Time changed"
        >
          <DatetimeInput
            label="Match time"
            name="dateInput"
            defaultValue={match.scheduled_at}
          />
        </ActionFormModal>
      </div>
    );
  }
  const isOfficer = await supabase(cookieStore).isMatchOfficer(match);

  const team = await getSessionPlayerTeam(match);

  return (
    <>
      <div className="text-gray font-bold mb-2">
        <Time date={match.scheduled_at} format="HH:mm - EEEE, MMMM d" />
        <Badge home={eventMatch.home_accepted} away={eventMatch.away_accepted} />
      </div>
      {isOfficer && team && <Alert match={match} eventMatch={eventMatch} team={team} />}
    </>
  );
}

function Alert({
  match,
  eventMatch,
  team,
}: {
  match: MatchesJoined;
  eventMatch: EventMatchesRow;
  team: 'home' | 'away';
}) {
  async function updateMatchScheduledAtSA(data: FormData) {
    'use server';
    const result = await updateMatchScheduledAt(match.id, data);
    if (result.data) {
      await acceptMatchTime(match, team, true);
    }
    return result;
  }

  async function acceptMatchTimeSA() {
    'use server';
    return acceptMatchTime(match, team, false);
  }

  if (eventMatch.home_accepted && eventMatch.away_accepted) {
    return null;
  }

  if (
    (eventMatch.home_accepted && team === 'home') ||
    (eventMatch.away_accepted && team === 'away')
  ) {
    return (
      <div role="alert" className="alert alert-info">
        <InformationCircleIcon className="w-5 h-5 mr-2" />
        <span>Waiting for opponent to accept match time...</span>
      </div>
    );
  }

  return (
    <div role="alert" className="alert alert-warning">
      <BellAlertIcon className="w-5 h-5 mr-2" />
      <span>Confirm match time or propose new</span>
      <ActionButton
        kind="btn-primary"
        size="btn-sm"
        action={acceptMatchTimeSA}
        successMessage="Match time accepted"
        errorMessage="Failed to accept match time"
      >
        Accept
      </ActionButton>
      <ActionFormModal
        title="Propose new time"
        openBtnLabel="Propose time"
        action={updateMatchScheduledAtSA}
        errorMessage="Something went wrong"
        successMessage="New time proposed"
      >
        <DatetimeInput
          label="Match time"
          name="dateInput"
          defaultValue={match.scheduled_at}
        />
      </ActionFormModal>
    </div>
  );
}

async function Badge({ home, away }: { home: boolean; away: boolean }) {
  return home && away ? (
    <div className="badge badge-success ml-1">Confirmed</div>
  ) : (
    <div className="badge badge-warning ml-1">Unconfirmed</div>
  );
}

export function MatchTimeFallback({ match }: { match: MatchesJoined }) {
  const date = match.scheduled_at || match.started_at || match.created_at;
  return (
    <p className="text-gray font-bold">
      <Time date={date} format="HH:mm - EEEE, MMMM d" />
    </p>
  );
}

async function getSessionPlayerTeam(match: MatchesJoined) {
  const cookieStore = await cookies();
  const { data: sessionPlayer } = await supabase(cookieStore).getSessionPlayer();
  if (match.home_team.players.some((p) => p.player_id === sessionPlayer?.id)) {
    return 'home';
  }
  if (match.away_team.players.some((p) => p.player_id === sessionPlayer?.id)) {
    return 'away';
  }
  return null;
}
