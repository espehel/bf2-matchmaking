import { ActionFunction, json, redirect } from '@remix-run/node';
import { remixClient, verifySingleResult } from '@bf2-matchmaking/supabase';
import invariant from 'tiny-invariant';
import moment from 'moment';

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);

    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'No matchId');
    const playerId = params['playerId'];
    invariant(playerId, 'No playerId');

    const { config } = await client.getMatch(matchId).then(verifySingleResult);
    const expireAt = moment().add(config.player_expire, 'ms').toISOString();

    const { error, status } = await client.updateMatchPlayer(matchId, playerId, {
      expire_at: expireAt,
    });

    if (error) {
      return json(error, { status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
