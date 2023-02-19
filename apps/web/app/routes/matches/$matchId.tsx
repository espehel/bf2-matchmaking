import { json, LoaderArgs } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { useLoaderData, useNavigate } from '@remix-run/react';
import DraftingContainer from '~/components/match/DraftingContainer';
import StagingContainer from '~/components/match/StagingContainer';
import StartedContainer from '~/components/match/StartedContainer';
import { remixClient } from '@bf2-matchmaking/supabase';
import { MatchStatus } from '@bf2-matchmaking/types';
import {
  useSubscribeMatchUpdate,
  useSubscribeMatchPlayer,
  useSubscribeRounds,
} from '~/state/supabase-subscription-hooks';
import { getDraftStep } from '@bf2-matchmaking/utils';
import AdminActions from '~/components/admin/MatchAdminPanel';
import { usePlayer } from '~/state/PlayerContext';
import { useUser } from '@supabase/auth-helpers-react';

export const loader = async ({ request, params }: LoaderArgs) => {
  const client = remixClient(request);
  const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
  const { data: match } = await client.getMatch(matchId);
  const { data: servers } = await client.getServers();
  invariant(match, 'Match not found');
  const rounds = await client.services.getMatchRounds(match);
  const draftStep = getDraftStep(match);
  const { data: matchAdmins } = await client.getMatchAdmins();
  return json(
    { match, servers, rounds, draftStep, matchAdmins },
    {
      headers: client.response.headers,
    }
  );
};

export default function Index() {
  const { match, draftStep, matchAdmins } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { player } = usePlayer();
  const user = useUser();

  const isAdmin = Boolean(
    player && matchAdmins && matchAdmins.some((admin) => admin.player_id === player.id)
  );

  useSubscribeMatchPlayer(() => {
    navigate('.', { replace: true });
  });

  useSubscribeMatchUpdate(() => {
    navigate('.', { replace: true });
  });

  useSubscribeRounds((event) => {
    if (match.server && match.server.ip === event.new.server) {
      navigate('.', { replace: true });
    }
  });

  return (
    <article className="route">
      <div className="flex flex-col justify-between mb-4">
        <div className="mb-4 section">
          <h1 className="text-2xl">Match {match.id}</h1>
          <span className="mr-4">Status: {match.status}</span>
          <span>Pick mode: {match.pick}</span>
          {match.channel && <span className="ml-4">Channel: {match.channel.name}</span>}
          {draftStep.captain && <span className="ml-4">Picking: {draftStep.captain.username}</span>}
          {match.server && <span className="ml-4">Server: {match.server.name}</span>}
        </div>
        {match.status === MatchStatus.Open && <StagingContainer />}
        {match.status === MatchStatus.Summoning && <StagingContainer />}
        {match.status === MatchStatus.Drafting && !user && <StagingContainer />}
        {match.status === MatchStatus.Drafting && user && <DraftingContainer />}
        {match.status === MatchStatus.Ongoing && <StartedContainer />}
        {match.status === MatchStatus.Closed && <StartedContainer />}
      </div>
      {isAdmin && <AdminActions match={match} />}
    </article>
  );
}
