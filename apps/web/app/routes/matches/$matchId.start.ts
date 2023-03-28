import { ActionFunction, json, LoaderFunction, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { remixClient } from '@bf2-matchmaking/supabase';
import { DraftType, MatchStatus } from '@bf2-matchmaking/types';
import { assignMatchPlayerTeams } from '@bf2-matchmaking/utils';

const getMaps = () => {
  const mapIds = new Set<number>();
  while (mapIds.size !== 2) {
    mapIds.add(Math.floor(Math.random() * 17) + 1);
  }
  return mapIds.values();
};

export const loader: LoaderFunction = ({ request, params }) => {
  return redirect(`/matches/${params['matchId']}`);
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const client = remixClient(request);
    const matchId = params['matchId'] ? parseInt(params['matchId']) : undefined;
    invariant(matchId, 'No matchId');
    const { data: match } = await client.getMatch(matchId);
    invariant(match, 'No match found');
    const addResult = await client.createMatchMaps(matchId, ...getMaps());

    if (match.config.draft === DraftType.Random) {
      const matchPlayers = assignMatchPlayerTeams(match.players);
      client.updateMatchPlayersForMatchId(
        match.id,
        matchPlayers.filter((mp) => mp.team === 'a'),
        { team: 'a' }
      );
      client.updateMatchPlayersForMatchId(
        match.id,
        matchPlayers.filter((mp) => mp.team === 'b'),
        { team: 'b' }
      );
    }

    const startResult = await client.updateMatch(matchId, {
      status: MatchStatus.Ongoing,
      started_at: new Date().toISOString(),
    });

    if (addResult.error) {
      return json(addResult.error, { status: addResult.status });
    }

    if (startResult.error) {
      return json(startResult.error, { status: startResult.status });
    }

    return redirect(`/matches/${params['matchId']}`);
  } catch (err) {
    console.error(err);
    return json(err, { status: 500 });
  }
};
