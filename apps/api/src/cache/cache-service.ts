import { getRegions } from '../platform/vultr';

export async function buildLocationsCache() {
  const regions = await getRegions();
  return regions.map(({ id }) => id);
}
