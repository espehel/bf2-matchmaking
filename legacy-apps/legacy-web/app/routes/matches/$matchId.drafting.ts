import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { remixClient } from '@bf2-matchmaking/supabase';
import { MatchStatus } from '@bf2-matchmaking/types';

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    const { data: match } = await client.getMatch(matchId);
    invariant(match, 'No match found');

    const shuffledPlayers = match.players; /*shuffleArray(match.players).filter(
      ({ id }) => id !== '45e66c7c-fce5-485c-9edd-a3dd84a0cb17'
    );*/
    if (shuffledPlayers.length < 2) {
      throw new Error('To few players for captian mode.');
    }
    await client.updateMatchPlayer(match.id, shuffledPlayers[0].id, { team: 1, captain: true });
    await client.updateMatchPlayer(match.id, shuffledPlayers[1].id, { team: 2, captain: true });

    const result = await client.updateMatch(matchId, { status: MatchStatus.Drafting });
    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
