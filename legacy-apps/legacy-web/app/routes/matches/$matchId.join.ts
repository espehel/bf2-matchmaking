import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { remixClient, verifySingleResult } from '@bf2-matchmaking/supabase';
import moment from 'moment/moment';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const {
      data: { session },
    } = await client.getSession();

    if (!session) {
      return redirect('/signin');
    }

    const { data: player } = await client.getPlayerByUserId(session.user.id);
    invariant(player, 'Could not find player connected to user id.');
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'No matchId');
    const { config } = await client.getMatch(matchId).then(verifySingleResult);
    const expire_at = moment().add(config.player_expire, 'ms').toISOString();

    const { error: err, status } = await client.createMatchPlayer(matchId, player.id, {
      expire_at,
    });

    if (err) {
      console.error(err);
      return json(err, { status });
    }
    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
