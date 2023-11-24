import {
  api,
  createServerDnsName,
  createServerLabel,
  createServerName,
} from '@bf2-matchmaking/utils';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';

export async function generateServer(location: string, match: MatchesJoined) {
  const name = createServerName(match);
  const dnsName = createServerDnsName(match);
  const label = createServerLabel(match);
  const result = await api.platform().postServers(name, location, label, dnsName);
  if (result.error) {
    error('generateServer', result.error);
  } else {
    info('generateServer', `Generated server ${result.data.id} for match ${match.id}`);
  }
  return result;
}
