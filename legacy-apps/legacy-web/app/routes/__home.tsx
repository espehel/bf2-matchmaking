import { ErrorBoundaryComponent, json, LoaderArgs } from '@remix-run/node';
import { Link, Outlet, useCatch, useLoaderData, useNavigate } from '@remix-run/react';
import { remixClient, verifyResult } from '@bf2-matchmaking/supabase';
import QuickMatchSection from '~/components/match/QuickMatchSection';
import { usePlayer } from '~/state/PlayerContext';
import {
  useSubscribeMatchInsert,
  useSubscribeMatchUpdate,
} from '~/state/supabase-subscription-hooks';
import { useCallback } from 'react';
import { isPostgrestError, MatchesJoined } from '@bf2-matchmaking/types';

export const loader = async ({ request }: LoaderArgs) => {
  const client = remixClient(request);

  try {
    const configs = await client.getActiveMatchConfigs().then(verifyResult);
    const quickMatches = await Promise.all(configs.map(client.services.getQuickMatchFromConfig));
    return json(
      { quickMatches },
      {
        headers: client.response.headers,
      }
    );
  } catch (error) {
    if (error instanceof Error || isPostgrestError(error)) {
      console.error(error);
      throw new Response(error.message, { status: 500 });
    } else if (typeof error === 'string') {
      console.error(error);
      throw new Response(error, { status: 500 });
    } else {
      throw error;
    }
  }
};

export default function Home() {
  const { player } = usePlayer();
  const { quickMatches } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const hasJoined = useCallback((match: MatchesJoined | null) => {
    return match?.players.some((matchPlayer) => matchPlayer.id === player?.id) || false;
  }, []);

  useSubscribeMatchInsert(() => {
    navigate('.', { replace: true });
  });

  useSubscribeMatchUpdate((payload) => {
    const match = quickMatches
      .map(([, match]) => match)
      .find((match) => match?.id === payload.new.id);
    if (match && hasJoined(match)) {
      navigate(`/matches/${match.id}`);
    } else if (match) {
      navigate('.', { replace: true });
    }
  });

  if (!quickMatches || quickMatches.length === 0) {
    return (
      <article className="route text-center">
        <h1 className="text-xl mb-4">No quick matches active</h1>
        <Link className="filled-button" to="/matches">
          Go to matches
        </Link>
      </article>
    );
  }
  return (
    <article className="route">
      <h1 className="text-4xl font-bold text-center mb-6">Quick match</h1>
      <ul>
        {quickMatches.map(([matchConfig, match]) => (
          <li key={matchConfig.id} className="mb-6">
            <QuickMatchSection config={matchConfig} match={match} hasJoined={hasJoined(match)} />
          </li>
        ))}
      </ul>
      <Outlet />
    </article>
  );
}

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
      <p>The stack trace is:</p>
      <pre>{error.stack}</pre>
    </div>
  );
};

export const CatchBoundary = () => {
  const caught = useCatch();

  return (
    <div>
      <h1>Caught</h1>
      <p>Status: {caught.status}</p>
      <pre>
        <code>{JSON.stringify(caught.data, null, 2)}</code>
      </pre>
    </div>
  );
};
