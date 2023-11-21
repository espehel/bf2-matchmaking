import { api } from '@bf2-matchmaking/utils';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';

export async function generateServer(location: string, match: MatchesJoined) {
  const name = `${match.config.name} Match ${match.id}`;
  const dnsName = `m${match.id}`;
  const result = await api
    .platform()
    .postServers(name, location, match.config.name, dnsName);
  if (result.error) {
    error('generateServer', result.error);
  } else {
    info('generateServer', `Generated server ${result.data.id} for match ${match.id}`);
  }
  return result;
}
