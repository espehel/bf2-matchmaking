import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import RoundTable from '@/components/RoundTable';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
}
export default async function LiveSection({ match }: Props) {
  const { data } = await api.rcon().getMatchLive(match.id);

  if (!data || match.status !== MatchStatus.Ongoing) {
    return null;
  }

  const { liveState, liveInfo } = data;

  return (
    <section className="section bg-secondary text-secondary-content w-full">
      <h2>Live</h2>
      <p>{`State: ${liveState}`}</p>
      {liveInfo ? <RoundTable liveInfo={liveInfo} /> : <p>No match server found</p>}
    </section>
  );
}
