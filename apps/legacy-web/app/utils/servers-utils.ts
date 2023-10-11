import { MatchesJoined, MatchStatus, ServersJoined } from '@bf2-matchmaking/types';
type Status = { status: string };
const isMatchDrafting = ({ status }: Status) => status === MatchStatus.Drafting;
const isMatchOngoing = ({ status }: Status) => status === MatchStatus.Ongoing;
export const isActive = (match: Status) => isMatchOngoing(match) || isMatchDrafting(match);
const getServerSortValue = (server: ServersJoined, match: MatchesJoined) => {
  if (server.ip === match.server?.ip) {
    return 0;
  }
  if (server.matches.some(isMatchDrafting)) {
    return 1;
  }
  if (server.matches.some(isMatchOngoing)) {
    return 2;
  }
  return 0;
};

export const compareServer =
  (match: MatchesJoined) => (serverA: ServersJoined, serverB: ServersJoined) =>
    getServerSortValue(serverA, match) - getServerSortValue(serverB, match);
