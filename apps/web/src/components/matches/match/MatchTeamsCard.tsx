import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import MatchActions from '@/components/matches/MatchActions';
import Link from 'next/link';
import TeamSection from '@/components/matches/team/TeamSection';
import React, { Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import SummoningSection from '@/components/matches/SummoningSection';
import { ArrowRightIcon } from '@heroicons/react/16/solid';
import MultiSelect from '@/components/form/fields/MultiSelect';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { Option } from '@/lib/types/form';
import { Card } from '@/components/commons/card/Card';
import {
  addMap,
  addMatchServer,
  removeMap,
  removeMatchServer,
} from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
}

export default async function MatchTeamsCard({ match }: Props) {
  const cookieStore = await cookies();
  const isMatchPlayer = await supabase(cookieStore).isMatchPlayer(match);
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  const hasAdmin =
    isMatchPlayer ||
    adminRoles?.match_admin ||
    adminRoles?.server_admin ||
    adminRoles?.system_admin;

  return (
    <Card>
      <div className="flex gap-4">
        <div className="border-primary border-1 p-2 rounded bg-base-300">
          <TeamsContent match={match} />
        </div>
        <MatchSetup match={match} />
      </div>
      {hasAdmin && (
        <>
          <div className="divider divider-start">Match actions</div>
          <Suspense fallback={null}>
            <MatchActions match={match} />
          </Suspense>
        </>
      )}
    </Card>
  );
}

function TeamsContent({ match }: { match: MatchesJoined }) {
  const isOpen =
    match.status === MatchStatus.Open || match.status === MatchStatus.Scheduled;

  if (match.config.type === 'Mix' && isOpen) {
    return (
      <div className="text-left">
        <ul className="list bg-base-200 rounded-md shadow-md shadow-base-300 w-sm">
          {match.players.map((player) => (
            <li className="list-row" key={player.id}>
              {player.nick}
            </li>
          ))}
        </ul>
        <Link href={`/matches/${match.id}/players`} className="btn btn-secondary mt-2">
          Manage players
          <ArrowRightIcon className="size-6" />
        </Link>
      </div>
    );
  }

  if (match.status === MatchStatus.Summoning) {
    return <SummoningSection match={match} />;
  }

  return (
    <div className="flex justify-start gap-8">
      <TeamSection match={match} team={match.home_team} />
      <div className="divider divider-horizontal">vs</div>
      <TeamSection match={match} team={match.away_team} />
    </div>
  );
}

async function MatchSetup({ match }: Props) {
  if (match.status === MatchStatus.Closed) {
    return (
      <Link
        className="btn btn-primary btn-lg btn-wide btn-outline shrink-1"
        href={`/results/${match.id}`}
      >
        Go to results
      </Link>
    );
  }

  const cookieStore = await cookies();
  const servers = await supabase(cookieStore).getServers().then(verifyResult);
  const maps = await supabase(cookieStore).getMaps().then(verifyResult);
  const { data: matchServers } = await supabase(cookieStore).getMatchServers(match.id);
  async function addServerAction(option: Option) {
    'use server';
    await addMatchServer(match.id, option[0].toString());
  }
  async function removeServerAction(option: Option) {
    'use server';
    await removeMatchServer(match.id, option[0].toString());
  }

  async function addMapAction(option: Option) {
    'use server';
    await addMap(match.id, Number(option[0]));
  }
  async function removeMapAction(option: Option) {
    'use server';
    await removeMap(match.id, Number(option[0]));
  }

  return (
    <div className="w-full min-w-0 space-y-2">
      <MultiSelect
        name="serverSelect"
        placeholder="Select servers"
        options={servers.map(({ ip, name }) => [ip, name])}
        defaultOptions={matchServers?.servers.map(({ ip, name }) => [ip, name])}
        onOptionSelected={addServerAction}
        onOptionRemoved={removeServerAction}
      />
      <MultiSelect
        name="mapSelect"
        placeholder="Select maps"
        options={maps.map(({ id, name }) => [id, name])}
        defaultOptions={match.maps.map(({ id, name }) => [id, name])}
        onOptionSelected={addMapAction}
        onOptionRemoved={removeMapAction}
      />
    </div>
  );
}
