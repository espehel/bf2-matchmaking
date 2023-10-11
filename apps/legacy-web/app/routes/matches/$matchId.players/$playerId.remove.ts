import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import { remixClient } from '@bf2-matchmaking/supabase';
import invariant from 'tiny-invariant';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'No matchId');
    const playerId = params['playerId'];
    invariant(playerId, 'No playerId');

    const { error, status } = await client.deleteMatchPlayer(matchId, playerId);

    if (error) {
      return json(error, { status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
