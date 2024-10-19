import { LiveServer } from '@bf2-matchmaking/types/server';
import { isConnectedLiveServer } from '@bf2-matchmaking/types';

export function sortLiveServerByName(array: Array<LiveServer>): Array<LiveServer> {
  return [...array].sort((a, b) => {
    if (isConnectedLiveServer(a) && isConnectedLiveServer(b)) {
      return a.data.name.localeCompare(b.data.name);
    }
    return a.address.localeCompare(b.address);
  });
}
