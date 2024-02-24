import {
  MatchConfigsRow,
  MatchPlayersInsert,
  PickedMatchPlayer,
  PlayerRatingsRow,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { compareRating, shuffleArray } from '@bf2-matchmaking/utils';
import { getUserIds, withRating } from './utils';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { PubobotMatch } from './PubobotMatch';
import { getLogChannel, sendMessage } from './message-service';
import {
  buildDebugActualDraftEmbed,
  buildDebugSuggestedDraftEmbed,
} from '@bf2-matchmaking/discord';

export const VALID_DRAFT_CONFIGS = [2, 9];

export async function buildDraftWithConfig(
  pubMatch: PubobotMatch,
  config: MatchConfigsRow
): Promise<Array<PickedMatchPlayer> | null> {
  try {
    const ratings = await client()
      .getPlayerRatingsByIdList(
        pubMatch.teams.map((mp) => mp.player_id),
        config.id
      )
      .then(verifyResult);

    const draft = buildMixTeams(pubMatch.teams, ratings);
    const pickList = buildDraftOrder(draft);
    if (pubMatch.teams.length === config.size && pickList.length === config.size) {
      await logSuggestedDraft(pubMatch, draft, config);
      return pickList;
    }
    logMessage(`Config ${config.name}: Draft conditions where not met`, {
      pubMatch,
      pickList,
      config,
    });
    return null;
  } catch (e) {
    logErrorMessage(`Failed to create draft for ${config.name}`, e, {
      config,
      pubMatch,
    });
    return null;
  }
}

async function logSuggestedDraft(
  pubMatch: PubobotMatch,
  draft: [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>],
  config: MatchConfigsRow
) {
  const channel = await getLogChannel();
  return sendMessage(
    channel,
    {
      embeds: [
        buildDebugSuggestedDraftEmbed(
          pubMatch.match.id,
          config.name,
          pubMatch.players,
          draft
        ),
      ],
    },
    { draft, config }
  );
}

export async function logActualDraft(pubMatch: PubobotMatch) {
  const channel = await getLogChannel();
  return sendMessage(channel, {
    embeds: [
      buildDebugActualDraftEmbed(
        pubMatch.match.id,
        'Actual',
        pubMatch.players,
        pubMatch.teams
      ),
    ],
  });
}

export function buildMixTeams(
  teams: Array<MatchPlayersInsert>,
  ratings: Array<PlayerRatingsRow>
): [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>] {
  const [teamA, teamB] = getTeamsBySnakeDraft(teams.map(withRating(ratings)));
  const team1 = teamA.sort(compareRating).map(withTeamAndCaptain(1));
  const team2 = teamB.sort(compareRating).map(withTeamAndCaptain(2));
  return [team1, team2];
}

function getTeamsBySnakeDraft(
  players: Array<RatedMatchPlayer>
): [Array<RatedMatchPlayer>, Array<RatedMatchPlayer>] {
  const sorted = [...players].sort((a, b) => a.rating - b.rating);
  const team1 = [];
  const team2 = [];

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / 2);
    if (round % 2 === 0) {
      if (i % 2 === 0) {
        team1.push(sorted[i]);
      } else {
        team2.push(sorted[i]);
      }
    } else {
      if (i % 2 === 0) {
        team2.push(sorted[i]);
      } else {
        team1.push(sorted[i]);
      }
    }
  }
  return [team1, team2];
}

function withTeamAndCaptain(team: number) {
  return (mp: RatedMatchPlayer, index: number): PickedMatchPlayer => ({
    ...mp,
    captain: index === 0,
    team,
  });
}

export function buildDraftOrder(
  teams: [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>]
): Array<PickedMatchPlayer> {
  const [team1, team2] = teams;
  return [team1[0], team2[0], ...shuffleArray(team1.slice(1).concat(team2.slice(1)))];
}

export function getUnpickList(pubMatch: PubobotMatch): Array<string> {
  return [
    ...getUserIds(pubMatch.getEmbed(), 'USMC'),
    ...getUserIds(pubMatch.getEmbed(), 'MEC/PLA'),
  ];
}
