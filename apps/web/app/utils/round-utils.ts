import { RoundsJoined } from '@bf2-matchmaking/types';

export const groupRoundsByDate = (rounds: Array<RoundsJoined>) =>
  rounds.sort(compareRoundByDate).reduce<Record<string, Array<RoundsJoined>>>((acc, cur) => {
    const dateString = new Date(cur.created_at).toDateString();
    const rounds = acc[dateString];
    if (rounds) {
      return { ...acc, [dateString]: rounds.concat(cur) };
    } else {
      return { ...acc, [dateString]: [cur] };
    }
  }, {});

export const groupRoundsByServer = (rounds: Array<RoundsJoined>) => {
  const groupedByServers = rounds.reduce<Record<string, Array<RoundsJoined>>>((acc, cur) => {
    if (!cur.server) {
      return acc;
    }
    const serverRounds = acc[cur.server.name];
    if (serverRounds) {
      return { ...acc, [cur.server.name]: serverRounds.concat(cur) };
    } else {
      return { ...acc, [cur.server.name]: [cur] };
    }
  }, {});

  return Object.entries(groupedByServers).sort((serverA, serverB) =>
    serverA[0].localeCompare(serverB[0])
  );
};

const compareRoundByDate = (roundA: RoundsJoined, roundB: RoundsJoined) =>
  roundB.created_at.localeCompare(roundA.created_at);
