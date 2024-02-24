import {
  LocationEmoji,
  MatchConfigsRow,
  MatchesJoined,
  MatchResultsJoined,
  LiveServer,
  ServersRow,
  PlayersRow,
  MatchPlayersInsert,
  PickedMatchPlayer,
  PollResult,
  isRatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  api,
  compareFullName,
  compareIsCaptain,
  compareMPRating,
  compareRating,
  getAverageRating,
  getMatchIdFromDnsName,
  getMatchPlayerNameWithRating,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import { buildPollPlayerlabel, replaceDiscordGG } from './embed-utils';
import { DateTime } from 'luxon';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';

export function buildDraftPollEndedEmbed(
  match: MatchesJoined,
  teams: Array<MatchPlayersInsert>,
  players: Array<PlayersRow>,
  pollResults: Array<PollResult> | null,
  accepted: boolean
): APIEmbed {
  const summary = pollResults
    ?.map(([reaction, votes]) => `(${reaction}: ${votes.length} votes)`)
    .join(', ');
  return {
    title: 'Suggested Draft',
    description: `Suggested draft was ${
      accepted ? 'accepted' : 'rejected'
    } with following vote count: ${summary}`,
    fields: [...createTeamFields(teams, players, pollResults), getMatchField(match)],
  };
}

export function buildDraftPollEmbed(
  match: MatchesJoined,
  teams: Array<MatchPlayersInsert>,
  players: Array<PlayersRow>,
  pollResults: Array<PollResult> | null,
  endTime: DateTime
): APIEmbed {
  return {
    title: 'Suggested Draft',
    description: `If at least half of the players from each team accept the suggested draft, teams will be auto drafted. Poll ends <t:${endTime.toUnixInteger()}:R>`,
    fields: [...createTeamFields(teams, players, pollResults), getMatchField(match)],
  };
}

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
    getLiveMatchField(match.id),
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
    getLiveMatchField(match.id),
  ],
});

export function buildDebugSuggestedDraftEmbed(
  matchId: number,
  draftLabel: string,
  players: Array<PlayersRow>,
  teams: [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>]
) {
  const team1 = teams[0].filter(isTeam(1)).sort(compareMPRating);
  const team2 = teams[1].filter(isTeam(2)).sort(compareMPRating);
  return {
    title: `Match ${matchId} Suggested Draft (${draftLabel})`,
    fields: [
      {
        name: getAverageRating(team1).toString(),
        value: team1.map(getMatchPlayerNameWithRating(players)).join('\n'),
        inline: true,
      },
      {
        name: getAverageRating(team2).toString(),
        value: team2.map(getMatchPlayerNameWithRating(players)).join('\n'),
        inline: true,
      },
      getLiveMatchField(matchId),
    ],
  };
}
export function buildDebugActualDraftEmbed(
  matchId: number,
  draftLabel: string,
  players: Array<PlayersRow>,
  teams: Array<MatchPlayersInsert>
) {
  const team1 = teams.filter(isTeam(1)).sort(compareMPRating);
  const team2 = teams.filter(isTeam(2)).sort(compareMPRating);
  return {
    title: `Match ${matchId} Actual Draft (${draftLabel})`,
    fields: [
      {
        name: getAverageRating(team1).toString(),
        value: team1.map(getMatchPlayerNameWithRating(players)).join('\n'),
        inline: true,
      },
      {
        name: getAverageRating(team2).toString(),
        value: team2.map(getMatchPlayerNameWithRating(players)).join('\n'),
        inline: true,
      },
      getLiveMatchField(matchId),
    ],
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
        fields: [...getServerInfoFields(server), getLiveMatchField(match.id)],
      }
    : {
        fields: [getLiveMatchField(match.id)],
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

function createTeamFields(
  teams: Array<MatchPlayersInsert>,
  players: Array<PlayersRow>,
  pollResults: Array<PollResult> | null
) {
  return [
    {
      name: 'Team A',
      value: [...getTeamPlayers(teams, players, 1)]
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildPollPlayerlabel(pollResults))
        .join('\n'),
      inline: true,
    },
    {
      name: 'Team B',
      value: [...getTeamPlayers(teams, players, 2)]
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildPollPlayerlabel(pollResults))
        .join('\n'),
      inline: true,
    },
  ];
}

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

export const getLiveMatchField = (matchId: number) => ({
  name: ``,
  value: `[**Match ${matchId}** live score](${api.web().basePath}/matches/${matchId})`,
});

export const getMatchField = (match: MatchesJoined) => ({
  name: ``,
  value: `[**Match ${match.id}**](${api.web().basePath}/matches/${match.id})`,
});

export const getMatchServerField = (match: MatchesJoined) => ({
  name: 'Create new server',
  value: `${api.web().basePath}/matches/${match.id}/server`,
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
