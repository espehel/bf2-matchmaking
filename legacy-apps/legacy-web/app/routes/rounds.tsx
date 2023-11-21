import React from 'react';
import { json, LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { groupRoundsByDate } from '~/utils/round-utils';
import { remixClient } from '@bf2-matchmaking/supabase';
import ServerRoundList from '~/components/round/ServerRoundList';

export const loader = async ({ request, params }: LoaderArgs) => {
  const client = remixClient(request);
  const { data: rounds, error, status } = await client.getRounds();

  if (error) {
    throw json(error, { status });
  }

  return json(
    { rounds },
    {
      headers: client.response.headers,
    }
  );
};

export default function Rounds() {
  const { rounds } = useLoaderData<typeof loader>();
  const groupedByDate = Object.entries(groupRoundsByDate(rounds));
  return (
    <article className="route">
      <h1 className="text-2xl">Rounds</h1>
      {groupedByDate.map(([date, dateRounds]) => (
        <section className="section mb-4" key={date}>
          <h2 className="text-xl">{date}</h2>
          <ServerRoundList rounds={dateRounds} />
        </section>
      ))}
      <Outlet />
    </article>
  );
}
