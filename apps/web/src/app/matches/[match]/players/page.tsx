import Main from '@/components/commons/Main';
import { matches } from '@/lib/supabase/supabase-server';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchLogSection from '@/components/matches/players/MatchLogSection';
import SignupsSection from '@/components/matches/players/SignupsSection';
import AddRoleForm from '@/components/matches/players/AddRoleForm';
import MatchRolesTable from '@/components/matches/players/MatchRolesTable';
import TeamsSection from '@/components/matches/players/TeamsSection';
interface Props {
  params: Promise<{ match: string }>;
}
export default async function MatchPlayersPage(props: Props) {
  const params = await props.params;
  const match = await matches.getJoined(Number(params.match)).then(verifySingleResult);
  const roles = await matches.roles.get(match.id).then(verifyResult);

  return (
    <Main
      title={`Match ${match.id} Players`}
      relevantRoles={['match_admin']}
      breadcrumbs={[
        { href: `/matches`, label: `Matches` },
        { href: `/matches/${match.id}`, label: match.id.toString() },
        { label: 'players' },
      ]}
    >
      <div className="grid grid-cols-2 gap-4">
        <SignupsSection match={match} />
        <div className="flex flex-col gap-4">
          <section className="section">
            <h2>Roles</h2>
            <AddRoleForm matchId={match.id} />
            <MatchRolesTable matchRoles={roles} />
          </section>
          <TeamsSection match={match} />
        </div>
        <MatchLogSection matchId={match.id} />
      </div>
    </Main>
  );
}
