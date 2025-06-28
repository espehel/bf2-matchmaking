import Main from '@/components/commons/Main';
import { matches } from '@/lib/supabase/supabase';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchLog from '@/components/matches/draft/MatchLog';
interface Props {
  params: Promise<{ match: string }>;
}
export default async function MatchDraftPage(props: Props) {
  const params = await props.params;
  const match = await matches.getJoined(Number(params.match)).then(verifySingleResult);

  return (
    <Main
      title={`Match ${match.id}`}
      relevantRoles={['match_admin']}
      breadcrumbs={[
        { href: `/matches`, label: `Matches` },
        { href: `/matches/${match.id}`, label: match.id.toString() },
      ]}
    >
      <section className="section w-fit mb-4">
        <h2>Sign ups</h2>
        <ul className="list bg-base-200 rounded-md shadow-md shadow-base-300 w-sm">
          {match.players.map((player) => (
            <li className="list-row" key={player.id}>
              {player.nick}
            </li>
          ))}
        </ul>
      </section>
      <MatchLog matchId={match.id} />
    </Main>
  );
}
