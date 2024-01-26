import { MatchesJoined } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import {
  createServerName,
  createServerSubDomain,
  getServerMap,
  getServerVehicles,
} from './utils';

export async function generateServers(match: MatchesJoined, regions: Array<string>) {
  if (!regions.length) {
    throw new Error('No regions provided for generating servers');
  }
  const results = await Promise.all(regions.map(createServer(match)));

  return {
    instances: results.filter((r) => r.data).map((r) => r.data),
    errors: results.filter((r) => r.error).map((r) => r.error),
  };
}

function createServer(match: MatchesJoined) {
  return (region: string, i: number, regions: Array<string>) => {
    const name = createServerName(match, i, regions);
    const map = getServerMap(match, i);
    const vehicles = getServerVehicles(match);
    const subDomain = createServerSubDomain(match, i, regions);

    return api.platform().postServers(name, region, match.id, map, vehicles, subDomain);
  };
}
