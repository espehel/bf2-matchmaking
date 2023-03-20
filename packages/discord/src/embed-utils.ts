import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';

const getMatchIdText = (match: MatchesJoined) => `Match ${match.id}`;
export const getEmbedTitle = (match: MatchesJoined) =>
  `${getMatchIdText(match)}: ${match.status}`;

export const isMatchTitle = (match: MatchesJoined, title?: string) =>
  title?.startsWith(getMatchIdText(match)) || false;

export const isSummonEmbed = (embed: { title: string | null | undefined }) =>
  embed.title?.includes(MatchStatus.Summoning) || false;

export const getMatchIdFromEmbed = (embed: {
  title: string | null | undefined;
}): number | undefined =>
  embed.title ? parseInt(embed.title.slice(6, embed.title.indexOf(': '))) : undefined;
