import { getRegions } from '../platform/vultr';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { isNotNull, MatchStatus } from '@bf2-matchmaking/types';

export async function buildLocationsCache() {
  const regions = await getRegions();
  return regions.map(({ id }) => id);
}

export async function buildMapsCache(): Promise<[string, string][]> {
  const maps = await client().getMaps().then(verifyResult);
  return maps.map((map) => [
    map.id.toString(),
    map.name.toLowerCase().replace(/ /g, '_'),
  ]);
}

export async function buildRconsCache(): Promise<[string, string][]> {
  const servers = await client().getServers().then(verifyResult);
  return servers
    .map((server) => server.rcon)
    .filter(isNotNull)
    .map((rcon) => [rcon.id, rcon.rcon_pw]);
}

export async function buildMatchesCache() {
  return client()
    .getMatchesWithStatus(
      MatchStatus.Scheduled,
      MatchStatus.Summoning,
      MatchStatus.Drafting,
      MatchStatus.Ongoing,
      MatchStatus.Finished
    )
    .then(verifyResult);
}
