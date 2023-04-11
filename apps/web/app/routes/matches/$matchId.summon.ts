import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import { remixClient } from '@bf2-matchmaking/supabase';
import invariant from 'tiny-invariant';
import { MatchStatus } from '@bf2-matchmaking/types';
import moment from 'moment';
import { SUMMONING_DURATION } from '@bf2-matchmaking/utils';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'No matchId');
    const { error, status } = await client.updateMatch(matchId, {
      status: MatchStatus.Summoning,
      ready_at: moment().add(SUMMONING_DURATION, 'ms').toISOString(),
    });

    if (error) {
      return json(error, { status: status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
