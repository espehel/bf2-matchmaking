import {
  MatchConfigsRow,
  MatchesJoined,
  MatchResultsJoined,
  MatchStatus,
  RconBf2Server,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  compareFullName,
  compareIsCaptain,
  compareUpdatedAt,
  getDraftStep,
  getPlayerName,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import { getEmbedTitle, replaceDiscordGG } from './embed-utils';
import { DateTime } from 'luxon';

export const getMatchEmbed = (match: MatchesJoined, description?: string): APIEmbed => ({
  title: getEmbedTitle(match),
  description: description || getMatchDescription(match),
  fields: getMatchFields(match),
  url: `https://bf2-matchmaking.netlify.app/matches/${match.id}`,
});

export const getServerPollEmbed = (
  match: MatchesJoined,
  servers: Array<[RconBf2Server, string, string]>,
  endTime: DateTime
): APIEmbed => ({
  description: `Vote for match ${
    match.id
  } server, poll ends <t:${endTime.toUnixInteger()}:R>`,
  fields: createServerPollFields(servers),
});
export const getServerEmbed = (server: RconBf2Server) => ({
  description: `Join [${replaceDiscordGG(server.name)}](${server.joinmeHref})`,
  fields: [
    { name: 'ip', value: server.ip, inline: true },
    { name: 'port', value: server.port, inline: true },
  ],
});

export const getLiveMatchEmbed = (match: ServerMatch, joinmeHref: string) => ({
  description: `Join [${replaceDiscordGG(match.server.name)}](${joinmeHref})`,
  fields: [
    { name: 'ip', value: match.server.ip, inline: true },
    { name: 'port', value: match.server.port, inline: true },
    getLiveMatchField(match),
  ],
});
export const getWarmUpStartedEmbed = (
  match: ServerMatch,
  serverName: string,
  joinmeHref: string
) => ({
  description: `Warm up started on [${replaceDiscordGG(serverName)}](${joinmeHref})`,
  fields: [
    { name: 'ip', value: match.server.ip, inline: true },
    { name: 'port', value: match.server.port, inline: true },
    getLiveMatchField(match),
  ],
});

export const getMatchStartedEmbed = (
  match: MatchesJoined,
  server?: RconBf2Server
): APIEmbed =>
  server
    ? {
        description: `**JOIN** [${replaceDiscordGG(server.name)}](${server.joinmeHref})`,
        fields: [...getServerInfoFields(server), getLiveMatchField(match)],
      }
    : {
        fields: [getLiveMatchField(match)],
      };
export const getMatchResultsEmbed = (
  match: MatchesJoined,
  results: [MatchResultsJoined, MatchResultsJoined]
): APIEmbed => ({
  description: `[**Match ${match.id}** results](https://bf2-matchmaking.vercel.app/results/${match.id})`,
  fields:
    results[0] && results[1]
      ? [
          {
            name: `Team ${results[0].team.name}`,
            value: results[0].maps.toString(),
            inline: true,
          },
          {
            name: `Team ${results[1].team.name}`,
            value: results[1].maps.toString(),
            inline: true,
          },
        ]
      : [],
});

export const getRulesEmbedByConfig = (config: MatchConfigsRow): APIEmbed => {
  return {
    title: 'MATCH RULES',
    description: getRulesDescriptionByConfig(config).concat(
      '\n**CHEATING OF ANY KIND WILL NOT BE TOLERATED**'
    ),
  };
};

const getRulesDescriptionByConfig = (config: MatchConfigsRow): string => {
  if (config.id === 9) {
    return (
      '**4v4**\n' +
      '- Medic kit only\n' +
      '- Flag by flag\n' +
      '- No commander\n' +
      '- Stationary machine guns not allowed'
    );
  }
  if (config.id === 13) {
    return (
      '**2v2**\n' +
      '- Medic kit only\n' +
      '- Flag by flag\n' +
      '- No commander\n' +
      '- Stationary machine guns not allowed'
    );
  }
  if (config.id === 10) {
    return (
      '**5v5**\n' +
      '- All kits allowed\n' +
      '- No claymores and C4\n' +
      '- No commander\n' +
      '- Stationary weapons allowed'
    );
  }
  if ([11, 1, 2, 12].includes(config.id)) {
    return '**8v8**\n' + '- No restrictions';
  }
  return '';
};

const getMatchDescription = (match: MatchesJoined): string | undefined => {
  if (match.status === MatchStatus.Summoning && match.ready_at) {
    return `Ready check ends <t:${DateTime.fromISO(match.ready_at).toUnixInteger()}:R>`;
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
const createServerPollFields = (servers: Array<[RconBf2Server, string, string]>) => [
  {
    name: 'Servers',
    value: servers.map(([, description, emoji]) => `${emoji}  ${description}`).join('\n'),
  },
];

export function createServerLocationPollField(endTime: DateTime) {
  return {
    name: 'Server',
    value: `Vote for server location! Poll ends <t:${endTime.toUnixInteger()}:R>`,
  };
}

export function createServerLocationPollResultField(location: string) {
  return {
    name: 'Server',
    value: `Creating new server in ${location}.`,
  };
}

const getServerInfoFields = (server: RconBf2Server) => [
  {
    name: 'IP:',
    value: `\`\`\`${server.ip}\`\`\``,
    inline: true,
  },
  {
    name: 'PORT',
    value: `\`\`\`${server.port}\`\`\``,
    inline: true,
  },
];

export const getLiveMatchField = (match: MatchesJoined) => ({
  name: ``,
  value: `[**Match ${match.id}** live score](https://bf2-matchmaking.vercel.app/matches/${match.id})`,
});

export const getMatchField = (match: MatchesJoined) => ({
  name: ``,
  value: `[**Match ${match.id}**](https://bf2-matchmaking.vercel.app/matches/${match.id})`,
});
