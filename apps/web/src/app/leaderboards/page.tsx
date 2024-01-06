import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import RatingTable from '@/components/leaderboards/RatingTable';
import JoinTimeTable from '@/components/leaderboards/JoinTimeTable';
import Link from 'next/link';

interface Props {
  searchParams: { tab?: string; sortField?: string; sortOrder?: string; length?: string };
}

export default async function LeaderboardsPage({ searchParams }: Props) {
  const { tab, sortField, sortOrder, length } = searchParams;
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  function concatHref(newParams: typeof searchParams) {
    const params = { ...searchParams, ...newParams };
    return `/leaderboards?${new URLSearchParams(params).toString()}`;
  }
  function getHref(newParams: typeof searchParams) {
    return `/leaderboards?${new URLSearchParams(newParams).toString()}`;
  }

  return (
    <main className="main flex flex-col gap-4">
      <h1>Leaderboards</h1>
      {adminRoles?.player_admin && (
        <div role="alert" className="alert alert-info w-fit">
          <ExclamationCircleIcon className="w-6 h-6" />
          <span>
            You get full insight into this data because you are a player admin. Normal
            users will only see top 10. Please treat this extra data as sensitive
            information.
          </span>
        </div>
      )}
      <section className="section w-fit">
        <div role="tablist" className="tabs tabs-bordered">
          <Link
            role="tab"
            className={`tab ${!tab || tab === 'rating4v4' ? 'tab-active' : ''}`}
            href={getHref({ tab: 'rating4v4' })}
          >
            4v4 Rating
          </Link>
          <div className="tab-content">
            <RatingTable
              config={9}
              concatHref={concatHref}
              sortOrder={sortOrder}
              length={length}
            />
          </div>
          <Link
            role="tab"
            className={`tab ${tab === 'rating5v5' ? 'tab-active' : ''}`}
            href={getHref({ tab: 'rating5v5' })}
          >
            5v5 Rating
          </Link>
          <div className="tab-content">
            <RatingTable
              config={10}
              concatHref={concatHref}
              sortOrder={sortOrder}
              length={length}
            />
          </div>
          <Link
            role="tab"
            className={`tab ${tab === 'join' ? 'tab-active' : ''}`}
            href={getHref({ tab: 'join' })}
          >
            Join time
          </Link>
          <div className="tab-content">
            <JoinTimeTable
              concatHref={concatHref}
              sortOrder={sortOrder}
              length={length}
              sortField={sortField}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
