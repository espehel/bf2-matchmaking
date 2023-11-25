import {
  api,
  createServerName,
  getInitialServerMap,
  getServerVehicles,
} from '@bf2-matchmaking/utils';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';

export async function generateServer(location: string, match: MatchesJoined) {
  const name = createServerName(match);
  const map = getInitialServerMap(match);
  const vehicles = getServerVehicles(match);

  const result = await api
    .platform()
    .postServers(name, location, match.id, map, vehicles);

  if (result.error) {
    error('generateServer', result.error);
  } else {
    info('generateServer', `Generated server ${result.data.id} for match ${match.id}`);
  }
  return result;
}
