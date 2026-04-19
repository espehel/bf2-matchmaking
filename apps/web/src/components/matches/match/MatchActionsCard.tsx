import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import MatchActions from '@/components/matches/MatchActions';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
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

export default async function MatchActionsCard({ match }: Props) {
  const cookieStore = await cookies();
  const isMatchPlayer = await supabase(cookieStore).isMatchPlayer(match);
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  const hasAdmin =
    isMatchPlayer ||
    adminRoles?.match_admin ||
    adminRoles?.server_admin ||
    adminRoles?.system_admin;

  if (!hasAdmin) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Card title="Match actions">
        <MatchSetup match={match} />
        <MatchActions match={match} />
      </Card>
    </Suspense>
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
