import { isNotNull, MatchPlayersInsert } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { logWarnMessage } from '@bf2-matchmaking/logging';
import { getUserIds } from './utils';
import { findMapId } from './supabase-service';
import { Embed } from 'discord.js';
import { getPlayersByIdList } from './player-service';
import { toMatchPlayer, toMatchPlayerWithTeamAndRating } from '@bf2-matchmaking/utils';

export async function buildMatchMaps(embed: Embed) {
  const mapName = embed.fields?.find((f) => f.name === 'Map')?.value || null;
  const map = mapName ? await findMapId(mapName) : null;
  return [map].filter(isNotNull);
}

export async function buildMatchPlayersFromStartingEmbed(
  embed: Embed,
  matchId: number,
  configId: number
): Promise<Array<MatchPlayersInsert>> {
  const team1Ids = getUserIds(embed, 'USMC');
  const team2Ids = getUserIds(embed, 'MEC/PLA');

  if (team1Ids.length === 0) {
    logWarnMessage(`Match ${matchId}: No players found for "USMC"`);
  }
  if (team2Ids.length === 0) {
    logWarnMessage(`Match ${matchId}: No players found for "MEC/PLA"`);
  }

  const team1 = await getPlayersByIdList(team1Ids);
  const team2 = await getPlayersByIdList(team2Ids);

  const { data: ratings } = await client().getPlayerRatingsByIdList(
    team1Ids.concat(team2Ids),
    configId
  );
  const teams = [
    ...team1.map(toMatchPlayerWithTeamAndRating(matchId, 1, ratings || [])),
    ...team2.map(toMatchPlayerWithTeamAndRating(matchId, 2, ratings || [])),
  ];

  return teams;
}

export async function buildMatchPlayersFromDraftingEmbed(
  embed: Embed,
  matchId: number
): Promise<Array<MatchPlayersInsert>> {
  const playerIds = [
    ...getUserIds(embed, 'MEC/PLA'),
    ...getUserIds(embed, 'USMC'),
    ...getUserIds(embed, 'Unpicked'),
  ];
  const players = await getPlayersByIdList(playerIds);
  return players.map(toMatchPlayer(matchId));
}
