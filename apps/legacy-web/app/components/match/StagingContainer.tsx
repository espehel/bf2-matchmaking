import { useLoaderData } from '@remix-run/react';
import { loader } from '~/routes/matches/$matchId';
import { FaCheckCircle } from 'react-icons/fa';
import { SummonedDialog } from '~/components/match/SummonedDialog';
import { MatchStatus } from '@bf2-matchmaking/types';
import PlayerActions from '~/components/match/PlayerActions';
import { useUser } from '@supabase/auth-helpers-react';
import PlayersSection from '~/components/match/PlayersSection';
import SigninSection from '~/components/match/SigninSection';

const StagingContainer = () => {
  const { match } = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <article className="flex justify-between flex-wrap gap-4">
      <PlayersSection match={match} />
      {user && <PlayerActions match={match} />}
      {!user && <SigninSection />}
      <SummonedDialog />
    </article>
  );
};
export default StagingContainer;
