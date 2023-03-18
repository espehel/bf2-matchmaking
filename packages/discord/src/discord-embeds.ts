import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  compareFullName,
  compareUpdatedAt,
  getDraftStep,
  getPlayerName,
  getPlayersReadyStatus,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import moment from 'moment';
import { getEmbedTitle } from './embed-utils';

export const getMatchEmbed = (match: MatchesJoined, description?: string): APIEmbed => ({
  title: getEmbedTitle(match),
  description: description || getMatchDescription(match),
  fields: getMatchFields(match),
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

const createCurrentPlayersFields = ({ status, players, teams, config }: MatchesJoined) =>
  status === MatchStatus.Open
    ? [
        {
          name: 'Players',
          value: `${players.length}/${config.size} | ${teams
            .sort(compareUpdatedAt)
            .map(getPlayerName(players))
            .join(', ')}`,
        },
      ]
    : [];

const createSummoningFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Summoning
    ? [
        {
          name: 'Ready players',
          value: getPlayersReadyStatus(match)
            .sort(compareFullName)
            .map(({ full_name, ready }) => `${ready ? '✅' : '❌'}  ${full_name}`)
            .join('\n'),
        },
      ]
    : [];

const createPoolFields = (match: MatchesJoined) =>
  match.status === MatchStatus.Drafting && getTeamPlayers(match, null).length > 0
    ? [
        {
          name: 'Pool',
          value: getTeamPlayers(match, null)
            .sort(compareFullName)
            .map((player) => player.full_name)
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
          value: getTeamPlayers(match, 'a')
            .sort(compareFullName)
            .map((player) => player.full_name)
            .join(', '),
        },
        {
          name: 'Team B',
          value: getTeamPlayers(match, 'b')
            .sort(compareFullName)
            .map((player) => player.full_name)
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
