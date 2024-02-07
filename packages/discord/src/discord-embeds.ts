import {
  LocationEmoji,
  MatchConfigsRow,
  MatchesJoined,
  MatchResultsJoined,
  MatchStatus,
  LiveServer,
  ServersRow,
} from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  api,
  compareFullName,
  compareIsCaptain,
  compareUpdatedAt,
  getDraftStep,
  getMatchIdFromDnsName,
  getPlayerName,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import { getEmbedTitle, replaceDiscordGG } from './embed-utils';
import { DateTime } from 'luxon';

export const getMatchEmbed = (
  match: MatchesJoined,
  server: ServersRow | null | undefined,
  description?: string
): APIEmbed => ({
  title: getEmbedTitle(match),
  description: description || getMatchDescription(match),
  fields: getMatchFields(match, server),
  url: `https://bf2-matchmaking.netlify.app/matches/${match.id}`,
});

export const getServerPollEmbed = (
  match: MatchesJoined,
  servers: Array<[LiveServer, string, string]>,
  endTime: DateTime
): APIEmbed => ({
  description: `Vote for match ${
    match.id
  } server, poll ends <t:${endTime.toUnixInteger()}:R>`,
  fields: createServerPollFields(servers),
});
export const getServerEmbed = (server: LiveServer) => ({
  description: `Join [${replaceDiscordGG(server.info.serverName)}](${server.joinmeHref})`,
  fields: [
    { name: 'address', value: server.address, inline: true },
    { name: 'port', value: server.port, inline: true },
  ],
});

export const getLiveMatchEmbed = (
  match: MatchesJoined,
  server: ServersRow,
  joinmeHref: string
) => ({
  description: `Join [${replaceDiscordGG(server.name)}](${joinmeHref})`,
  fields: [
    { name: 'address', value: server.ip, inline: true },
    { name: 'port', value: server.port, inline: true },
    getLiveMatchField(match),
  ],
});
export const getWarmUpStartedEmbed = (
  match: MatchesJoined,
  server: ServersRow,
  serverName: string,
  joinmeHref: string
) => ({
  description: `Warm up started on [${replaceDiscordGG(serverName)}](${joinmeHref})`,
  fields: [
    { name: 'address', value: server.ip, inline: true },
    { name: 'port', value: server.port, inline: true },
    getLiveMatchField(match),
  ],
});

export function getTeamDraftEmbed(
  draftType: string,
  teams: { rating: number; players: string[] }[]
) {
  return {
    title: draftType,
    fields: teams.map(({ rating, players }) => ({
      name: rating.toString(),
      value: players.join('\n'),
      inline: true,
    })),
  };
}
export const getMatchStartedEmbed = (
  match: MatchesJoined,
  server?: LiveServer
): APIEmbed =>
  server
    ? {
        description: `**JOIN** [${replaceDiscordGG(server.info.serverName)}](${
          server.joinmeHref
        })`,
        fields: [...getServerInfoFields(server), getLiveMatchField(match)],
      }
    : {
        fields: [getLiveMatchField(match)],
      };
export const getMatchResultsEmbed = (
  match: MatchesJoined,
  results: [MatchResultsJoined, MatchResultsJoined]
): APIEmbed => ({
  description: `[**Match ${match.id}** results](${api.web().basePath}/results/${
    match.id
  })`,
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
    return captain ? `${captain.nick} is picking` : undefined;
  }
};

const getMatchFields = (match: MatchesJoined, server: ServersRow | null | undefined) =>
  createCurrentPlayersFields(match)
    .concat(createSummoningFields(match))
    .concat(createPoolFields(match))
    .concat(createTeamFields(match))
    .concat(createServerFields(match, server));

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
            .map(({ player, ready }) => `${ready ? '✅' : '❌'}  ${player.nick}`)
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

const createServerFields = (
  match: MatchesJoined,
  server: ServersRow | null | undefined
) =>
  (match.status === MatchStatus.Drafting || match.status === MatchStatus.Ongoing) &&
  server
    ? [
        {
          name: server.name,
          value: `https://joinme.click/g/bf2/${server.ip}:${server.port}`,
        },
      ]
    : [];
const createServerPollFields = (servers: Array<[LiveServer, string, string]>) => [
  {
    name: 'Servers',
    value: servers.map(([, description, emoji]) => `${emoji}  ${description}`).join('\n'),
  },
];

export function createServerLocationPollField(endTime: DateTime) {
  return {
    name: 'Server',
    value: `Vote for server location! Poll ends <t:${endTime.toUnixInteger()}:R>`
      .concat(`\n${LocationEmoji.NewYork}: New York`)
      .concat(`\n${LocationEmoji.Existing}: Existing server`),
  };
}

export function createServerLocationPollResultField(location: string) {
  return {
    name: 'Server',
    value: `Creating new server in ${location}.`,
  };
}

const getServerInfoFields = (server: LiveServer) => [
  {
    name: 'address:',
    value: `\`\`\`${server.address}\`\`\``,
    inline: true,
  },
  {
    name: 'port',
    value: `\`\`\`${server.port}\`\`\``,
    inline: true,
  },
];

export const getLiveMatchField = (match: MatchesJoined) => ({
  name: ``,
  value: `[**Match ${match.id}** live score](${api.web().basePath}/matches/${match.id})`,
});

export const getMatchField = (match: MatchesJoined) => ({
  name: ``,
  value: `[**Match ${match.id}**](${api.web().basePath}/matches/${match.id})`,
});

export function getServerFields(servers: Array<LiveServer>) {
  return servers
    .filter((server) => !getMatchIdFromDnsName(server.address))
    .map((server) => ({
      name: server.info.serverName.concat(
        server.info
          ? ` (${server.info.connectedPlayers}/${server.info.maxPlayers})`
          : ' (offline)'
      ),
      value: `[${server.address}:${server.port}](${server.joinmeHref})`,
    }));
}
