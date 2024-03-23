import {
  MatchesJoined,
  MatchStatus,
  PollResult,
  TeamPlayer,
} from '@bf2-matchmaking/types';

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

export const createPlayerMentions = (match: MatchesJoined) =>
  match.teams.map((player) => `<@${player.player_id}>`).join(', ');

export const replaceDiscordGG = (text: string) =>
  text.replace('discord.gg', '*discord.gg*');

export function buildPollPlayerlabel(results: Array<PollResult> | null) {
  return (tp: TeamPlayer) => {
    const playerVotes =
      results
        ?.filter(([, votes]) => votes.includes(tp.player_id))
        .map(([reaction]) => reaction)
        .join()
        .concat(' ') || '';

    const nick = tp.captain ? `**${tp.player.nick}**` : tp.player.nick;

    return `${playerVotes}${nick}`;
  };
}

export function buildMatchPlayerlabel(tp: TeamPlayer) {
  return tp.captain ? `**${tp.player.nick}**` : tp.player.nick;
}
