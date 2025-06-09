import React, { Suspense } from 'react';
import CreateMatchFromDiscordForm from '@/components/matches/schedule/CreateMatchFromDiscordForm';
import CreateMatchForm from '@/components/matches/schedule/CreateMatchForm';

type SearchParam = string | undefined;

interface Props {
  searchParams: Promise<{ [key: string]: SearchParam }>;
}

export default async function ScheduleMatchPage({ searchParams }: Props) {
  const { time, servers, maps } = await searchParams;
  console.log(servers);
  console.log(maps);
  return (
    <main className="main">
      <h1 className="text-3xl font-bold">Schedule Custom Match</h1>
      <section className="section">
        <ul className="list">
          <li>
            <Suspense fallback={null}>
              <CreateMatchForm />
            </Suspense>
            <Suspense fallback={null}>
              <CreateMatchFromDiscordForm
                defaultMaps={toMapIds(maps)}
                defaultServers={toServerAdresses(servers)}
                defaultTime={toTime(time)}
              />
            </Suspense>
          </li>
        </ul>
      </section>
    </main>
  );
}
function toMapIds(param: SearchParam) {
  if (typeof param === 'string') {
    return param.split(',').map(Number);
  }
}

function toServerAdresses(param: SearchParam) {
  if (typeof param === 'string') {
    return param.split(',');
  }
}

function toTime(param: SearchParam) {
  if (typeof param === 'string') {
    return param;
  }
  if (Array.isArray(param)) {
    return param[0];
  }
  return;
}
