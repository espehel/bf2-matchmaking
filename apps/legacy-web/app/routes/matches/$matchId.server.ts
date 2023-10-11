import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { remixClient } from '@bf2-matchmaking/supabase';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const formData = await request.formData();
    const serverIp = formData.get('serverIp')?.toString();
    invariant(serverIp, 'serverIp not defined');
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    const result = await client.updateMatch(matchId, { server: serverIp });

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
