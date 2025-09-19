import {
  LocationEmoji,
  MatchConfigsRow,
  MatchesJoined,
  MatchResultsJoined,
  ServersRow,
  PlayersRow,
  MatchPlayersInsert,
  PickedMatchPlayer,
  PollResult,
  MatchPlayerResultsInsert,
  StartedMatch,
} from '@bf2-matchmaking/types';
import { APIEmbed } from 'discord-api-types/v10';
import {
  api,
  compareFullName,
  compareIsCaptain,
  compareMPRating,
  getAverageRating,
  getMatchIdFromDnsName,
  getMatchPlayerNameWithRating,
  getMatchPlayerResultNameWithRating,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';
import {
  buildMatchPlayerlabel,
  buildPollPlayerlabel,
  replaceDiscordGG,
} from './embed-utils';
import { DateTime } from 'luxon';
import { isTeam } from '@bf2-matchmaking/utils';
import {
  ConnectedLiveServer,
  LiveServer,
  ServerData,
} from '@bf2-matchmaking/types/server';

export function buildMatchDemoContent(
  server: string,
  match: StartedMatch,
  serverData: ServerData
) {
  return `**Match ${match.id} @ ${server}**\n
  Server: ${serverData.name}\n
  Maps: ${match.maps.map((m) => m.name).join(', ')}\n
  Players: ${match.players.map((p) => p.nick).join(', ')}\n
  [bf2.top](${api.web().basePath}/matches/${match.id})
  `;
}

export function buildTeamspeakMatchStartedEmbed(match: MatchesJoined): APIEmbed {
  return {
    title: `Match ${match.id} started`,
    fields: [...buildTeamFields(match.teams, match.players), getLiveMatchField(match.id)],
  };
}

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
    fields: [
      ...buildPollResultsTeamFields(teams, players, pollResults),
      getMatchField(match),
    ],
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
    fields: [
      ...buildPollResultsTeamFields(teams, players, pollResults),
      getMatchField(match),
    ],
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
export const getServerEmbed = (server: ConnectedLiveServer) => ({
  description: `Join [${replaceDiscordGG(server.live.serverName)}](${
    server.data.joinmeHref
  })`,
  fields: [
    { name: 'address', value: server.address, inline: true },
    { name: 'port', value: server.data.port, inline: true },
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
  matchId: number,
  address: string,
  server: { joinmeHref: string; name: string; port: string }
) => ({
  description: `Warm up started on [${replaceDiscordGG(server.name)}](${
    server.joinmeHref
  })`,
  fields: [
    { name: 'address', value: address, inline: true },
    { name: 'port', value: server.port, inline: true },
    getLiveMatchField(matchId),
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
export function buildDebugDraftEndedEmbed(
  matchId: number,
  draftLabel: string,
  pollResults: Array<PollResult> | null,
  accepted: boolean
): APIEmbed {
  const summary = pollResults
    ?.map(([reaction, votes]) => `(${reaction}: ${votes.length} votes)`)
    .join(', ');
  return {
    title: `Match ${matchId} Draft result (${draftLabel})`,
    description: `Suggested draft was ${
      accepted ? 'accepted' : 'rejected'
    } with following vote count: ${summary}`,
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
  server?: ConnectedLiveServer
): APIEmbed =>
  server
    ? {
        description: `**JOIN** [${replaceDiscordGG(server.live.serverName)}](${
          server.data.joinmeHref
        })`,
        fields: [...getServerInfoFields(server), getLiveMatchField(match.id)],
      }
    : {
        fields: [getLiveMatchField(match.id)],
      };

export const getDebugMatchResultsEmbed = (
  match: MatchesJoined,
  results: [MatchResultsJoined, MatchResultsJoined],
  playerResults: Array<MatchPlayerResultsInsert>
): APIEmbed => ({
  title: `Match ${match.id} results`,
  fields:
    results[0] && results[1]
      ? [
          {
            name: `Team ${results[0].team.name}: ${results[0].maps}`,
            value: playerResults
              .filter((result) => result.team === results[0].team.id)
              .map(getMatchPlayerResultNameWithRating(match.players))
              .join('\n'),
            inline: true,
          },
          {
            name: `Team ${results[1].team.name}: ${results[1].maps}`,
            value: playerResults
              .filter((result) => result.team === results[1].team.id)
              .map(getMatchPlayerResultNameWithRating(match.players))
              .join('\n'),
            inline: true,
          },
        ]
      : [],
});

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

function buildTeamFields(teams: Array<MatchPlayersInsert>, players: Array<PlayersRow>) {
  return [
    {
      name: 'Team A',
      value: getTeamPlayers(teams, players, 1)
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildMatchPlayerlabel)
        .join('\n'),
      inline: true,
    },
    {
      name: 'Team B',
      value: getTeamPlayers(teams, players, 2)
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildMatchPlayerlabel)
        .join('\n'),
      inline: true,
    },
  ];
}

function buildPollResultsTeamFields(
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

const getServerInfoFields = (server: ConnectedLiveServer) => [
  {
    name: 'address:',
    value: `\`\`\`${server.address}\`\`\``,
    inline: true,
  },
  {
    name: 'port',
    value: `\`\`\`${server.data.port}\`\`\``,
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
      name: server.name.concat(
        server.live
          ? ` (${server.live.connectedPlayers}/${server.live.maxPlayers})`
          : ` (${server.status})`
      ),
      value: server.data
        ? `[${server.address}:${server.data.port}](${server.data.joinmeHref})`
        : server.address,
    }));
}
