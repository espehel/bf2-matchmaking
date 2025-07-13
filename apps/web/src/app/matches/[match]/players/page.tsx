import Main from '@/components/commons/Main';
import { matches } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchLogSection from '@/components/matches/players/MatchLogSection';
import TeamSection from '@/components/matches/TeamSection';
import { setMatchPlayerTeams } from '@/app/matches/[match]/players/actions';
import ActionButton from '@/components/commons/action/ActionButton';
import SignupsSection from '@/components/matches/players/SignupsSection';
interface Props {
  params: Promise<{ match: string }>;
}
export default async function MatchPlayersPage(props: Props) {
  const params = await props.params;
  const match = await matches.getJoined(Number(params.match)).then(verifySingleResult);

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
        <section className="section col-span-2 xl:col-span-1">
          <h2>Teams</h2>
          <fieldset className="fieldset flex bg-base-200 border-base-300 rounded-box border p-4">
            <legend className="fieldset-legend">Mix teams</legend>
            <ActionButton
              className="btn btn-secondary btn-lg"
              action={setMatchPlayerTeams}
              input={{ matchId: match.id, method: 'random' }}
            >
              Random
            </ActionButton>
            <ActionButton
              className="btn btn-secondary btn-lg"
              action={setMatchPlayerTeams}
              input={{ matchId: match.id, method: 'rating' }}
            >
              Rating
            </ActionButton>
            <ActionButton
              className="btn btn-secondary btn-lg"
              action={setMatchPlayerTeams}
              input={{ matchId: match.id, method: 'roles' }}
            >
              Rating and roles
            </ActionButton>
          </fieldset>
          <div className="flex justify-center gap-8">
            <TeamSection match={match} team={match.home_team} />
            <div className="divider divider-horizontal">vs</div>
            <TeamSection match={match} team={match.away_team} />
          </div>
        </section>
        <MatchLogSection matchId={match.id} />
      </div>
    </Main>
  );
}
