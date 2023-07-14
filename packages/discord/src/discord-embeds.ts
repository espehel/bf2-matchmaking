import { MatchesJoined, MatchStatus, RconBf2Server } from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  compareFullName,
  compareIsCaptain,
  compareUpdatedAt,
  getDraftStep,
  getPlayerName,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import moment, { Moment } from 'moment';
import { getEmbedTitle } from './embed-utils';

export const getMatchEmbed = (match: MatchesJoined, description?: string): APIEmbed => ({
  title: getEmbedTitle(match),
  description: description || getMatchDescription(match),
  fields: getMatchFields(match),
  url: `https://bf2-matchmaking.netlify.app/matches/${match.id}`,
});

export const getServerPollEmbed = (
  match: MatchesJoined,
  servers: Array<[RconBf2Server, string, string]>,
  endTime: Moment
): APIEmbed => ({
  title: getEmbedTitle(match),
  description: getServerPollDescription(match, endTime),
  fields: createServerPollFields(match, servers),
  url: `https://bf2-matchmaking.netlify.app/matches/${match.id}`,
});

const getMatchDescription = (match: MatchesJoined): string | undefined => {
  if (match.status === MatchStatus.Summoning && match.ready_at) {
    return `Ready check ends <t:${moment(match.ready_at).unix()}:R>`;
  }
  if (match.status === MatchStatus.Drafting) {
    const { captain } = getDraftStep(match);
    return captain ? `${captain.username} is picking` : undefined;
  }
};

const getMatchFields = (match: MatchesJoined) =>
  createCurrentPlayersFields(match)
    .concat(createSummoningFields(match))
    .concat(createPoolFields(match))
    .concat(createTeamFields(match))
    .concat(createServerFields(match));

const createCurrentPlayersFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Open
    ? [
        {
          name: 'Players',
          value: `${match.players.length}/${match.config.size} | ${[
            ...getTeamPlayers(match),
          ]
            .sort(compareUpdatedAt)
            .map(getPlayerName)
            .join(', ')}`,
        },
      ]
    : [];

const createSummoningFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Summoning
    ? [
        {
          name: 'Ready players',
          value: [...getTeamPlayers(match)]
            .sort(compareFullName)
            .map(({ player, ready }) => `${ready ? '✅' : '❌'}  ${player.full_name}`)
            .join('\n'),
        },
      ]
    : [];

const createPoolFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Drafting && getTeamPlayers(match, null).length > 0
    ? [
        {
          name: 'Pool',
          value: [...getTeamPlayers(match, null)]
            .sort(compareFullName)
            .map(getPlayerName)
            .join(', '),
        },
      ]
    : [];

const createTeamFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Drafting ||
  match.status === MatchStatus.Ongoing ||
  match.status === MatchStatus.Closed
    ? [
        {
          name: 'Team A',
          value: [...getTeamPlayers(match, 'a')]
            .sort(compareFullName)
            .sort(compareIsCaptain)
            .map(getPlayerName)
            .join(', '),
        },
        {
          name: 'Team B',
          value: [...getTeamPlayers(match, 'b')]
            .sort(compareFullName)
            .sort(compareIsCaptain)
            .map(getPlayerName)
            .join(', '),
        },
      ]
    : [];

const createServerFields = (match: MatchesJoined) =>
  (match.status === MatchStatus.Drafting || match.status === MatchStatus.Ongoing) &&
  match.server
    ? [
        {
          name: match.server.name,
          value: `https://joinme.click/g/bf2/${match.server.ip}:${match.server.port}`,
        },
      ]
    : [];

const getServerPollDescription = (match: MatchesJoined, endTime: Moment) => {
  if (!match.server) {
    return `Vote for match server, poll ends <t:${endTime.unix()}:R>`;
  }
  return undefined;
};
const createServerPollFields = (
  match: MatchesJoined,
  servers: Array<[RconBf2Server, string, string]>
) =>
  !match.server
    ? [
        {
          name: 'Servers',
          value: servers
            .map(([, description, emoji]) => `${emoji}  ${description}`)
            .join('\n'),
        },
      ]
    : [];
