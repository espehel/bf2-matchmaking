import { getJSON } from './fetcher';
import { getCachedValue, setCachedValue } from './cache';

interface ServerLocation {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export const ip = () => {
  return {
    getIpLocation: async (ip: string) => {
      const cachedIp = getCachedValue<ServerLocation>(ip);
      if (cachedIp) {
        return { data: cachedIp, error: null };
      }
      const res = await getJSON<ServerLocation>(`http://ip-api.com/json/${ip}`);
      if (res.data) {
        setCachedValue(ip, res.data);
      }
      return res;
    },
  };
};
