import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { createScheduledMatch } from '@/app/matches/actions';
import { DateTime } from 'luxon';
import React from 'react';
import ActionForm from '@/components/commons/action/ActionForm';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import SelectField from '@/components/form/fields/SelectField';
import DatetimeInput from '@/components/form/fields/DatetimeInput';
import { NotSignedInCard } from '@/components/commons/NotSignedInCard';
import Link from 'next/link';
import { Card } from '@/components/commons/card/Card';

export default async function ScheduleMatchForm() {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();

  if (!player) {
    return <NotSignedInCard text="Sign in to schedule matches" />;
  }

  const configs = await supabase(cookieStore)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterVisible);
  const teams = await supabase(cookieStore)
    .getActiveTeams()
    .then(verifyResult)
    .then(sortByName);

  if (teams.length < 2) {
    throw new Error('Not enough teams found.');
  }

  const defaultHomeTeam =
    teams.find((t) => t.players.some((p) => p.player_id === player.id))?.id ??
    teams.at(0)?.id;
  const defaultAwayTeam = teams.find((t) => t.id !== defaultHomeTeam)?.id;
  const defaultConfig = configs.find((c) => c.name === 'PB 5v5 Cup')?.id;

  return (
    <Card title="Schedule new match">
      <ActionForm formAction={createScheduledMatch} className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          <SelectField
            label="Type"
            name="configSelect"
            kind="accent"
            size="lg"
            defaultValue={defaultConfig}
            options={configs.map<[number, string]>(({ id, name }) => [id, name])}
          />
          <DatetimeInput
            label="Match start"
            name="scheduledInput"
            kind="accent"
            size="lg"
            defaultValue={DateTime.utc()
              .plus({ day: 1 })
              .set({ hour: 19, minute: 0 })
              .toISO()}
            min={DateTime.utc().toISO()}
          />
        </div>
        <div className="flex gap-4 flex-wrap items-end">
          <SelectField
            label="Home team"
            name="homeSelect"
            kind="accent"
            size="lg"
            options={teams.map<[number, string]>(({ id, name }) => [id, name])}
            defaultValue={defaultHomeTeam}
          />
          <SelectField
            label="Away team"
            name="awaySelect"
            kind="accent"
            size="lg"
            options={teams.map<[number, string]>(({ id, name }) => [id, name])}
            defaultValue={defaultAwayTeam}
          />
          <Link
            href="/teams"
            target="_blank"
            className="btn btn-outline btn-accent btn-sm mb-1"
          >
            Add team
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </Link>
        </div>
        <div className="card-actions justify-end mt-4">
          <button type="submit" className="btn btn-primary btn-lg">
            <TransitionWrapper keepSize={true}>Create match</TransitionWrapper>
          </button>
        </div>
      </ActionForm>
    </Card>
  );
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}

function sortByName<T extends { name: string }>(array: Array<T>): Array<T> {
  return [...array].sort((a, b) => a.name.localeCompare(b.name));
}
