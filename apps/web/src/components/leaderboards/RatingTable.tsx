import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import Link from 'next/link';

interface Props {
  sortOrder?: string;
  length?: string;
  config: number;
  concatHref: (newParams: { sortOrder?: string; length?: string }) => string;
}

export default async function RatingTable({
  config,
  sortOrder,
  length,
  concatHref,
}: Props) {
  const cookieStore = await cookies();
  const { data: ratings } = await supabase(cookieStore).getPlayerRatingsByConfig(config);
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  let sortedRatings =
    ratings?.sort((a, b) => {
      if (sortOrder === 'asc' && adminRoles?.player_admin) {
        return a.rating - b.rating;
      }
      return b.rating - a.rating;
    }) || [];

  sortedRatings =
    length === 'full' && adminRoles?.player_admin
      ? sortedRatings
      : sortedRatings.slice(0, 10);

  return (
    <div>
      <table className="table table-lg">
        <thead>
          <tr>
            <th></th>
            <th>Nick</th>
            <th>
              <Link
                href={concatHref({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
              >
                Rating
              </Link>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRatings.map((rating, i) => (
            <tr key={i}>
              <th>{i + 1}</th>
              <td>{rating.player?.nick}</td>
              <td>{rating.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {adminRoles?.player_admin && (
        <Link href={concatHref({ length: 'full' })}>See all</Link>
      )}
    </div>
  );
}
