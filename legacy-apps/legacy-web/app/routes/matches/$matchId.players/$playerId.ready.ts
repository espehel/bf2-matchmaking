import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { remixClient } from '@bf2-matchmaking/supabase';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'matchId not defined');
    const playerId = params['playerId'];
    invariant(playerId, 'playerId not defined');

    await client.updateMatchPlayer(matchId, playerId, { ready: true });

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
