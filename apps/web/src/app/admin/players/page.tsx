import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import BetaPlayersForm from '@/components/players/BetaPlayersForm';

export default async function AdminPlayersPage() {
  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  if (!adminRoles?.player_admin) {
    return <div>You do not have permission to view this page</div>;
  }

  const { data: betaPlayers } = await supabase(cookieStore).getBetaPlayers();

  return (
    <main className="main flex flex-col items-center gap-8">
      <h1>Player Admin</h1>
      <section className="section w-fit">
        <h2>Beta players</h2>
        <ul>
          {betaPlayers?.map((player) => (
            <li key={player.id}>
              <span>{player.nick}</span>
            </li>
          ))}
        </ul>
        <BetaPlayersForm betaPlayerIds={betaPlayers?.map(({ id }) => id) || []} />
      </section>
    </main>
  );
}
