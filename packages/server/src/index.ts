import { CreateServerOptions, isNotNull, MatchesJoined } from '@bf2-matchmaking/types';
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
  const results = await Promise.all(regions.map(generateServer(match)));

  return {
    instances: results
      .filter((r) => r.data)
      .map((r) => r.data)
      .filter(isNotNull),
    errors: results
      .filter((r) => r.error)
      .map((r) => r.error)
      .filter(isNotNull),
  };
}

function generateServer(match: MatchesJoined) {
  return (region: string, i: number, regions: Array<string>) => {
    const name = createServerName(match, i, regions);
    const map = getServerMap(match, i);
    const subDomain = createServerSubDomain(match, i, regions);

    return createServerInstance(match, { name, region, map, subDomain });
  };
}

export function createServerInstance(match: MatchesJoined, options: CreateServerOptions) {
  const { name, region, map, subDomain } = options;
  const vehicles = getServerVehicles(match);
  return api.platform().postServers(name, region, match.id, map, vehicles, subDomain);
}
