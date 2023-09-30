import {
  isDiscordMatch,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { assignMatchPlayerTeams, shuffleArray } from '@bf2-matchmaking/utils';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import moment from 'moment/moment';
import { reopenMatch } from './match-service';
import { sendChannelMessage } from '@bf2-matchmaking/discord';

export const setRandomTeams = async (match: MatchesJoined) => {
  const matchPlayers = assignMatchPlayerTeams(match.players);
  await Promise.all([
    client().updateMatchPlayersForMatchId(
      match.id,
      matchPlayers.filter((mp) => mp.team === 1),
      { team: 1 }
    ),
    client().updateMatchPlayersForMatchId(
      match.id,
      matchPlayers.filter((mp) => mp.team === 2),
      { team: 2 }
    ),
  ]);
};

export const setMatchCaptains = async (match: MatchesJoined) => {
  const shuffledPlayers = shuffleArray(
    match.players.filter((player) => !player.username.includes('Test'))
  );
  if (shuffledPlayers.length < 2) {
    throw new Error('To few players for captain mode.');
  }
  info(
    'setMatchCaptains',
    `Setting player ${shuffledPlayers[0].id} as captain for team a.`
  );
  await client()
    .updateMatchPlayer(match.id, shuffledPlayers[0].id, {
      team: 1,
      captain: true,
    })
    .then(verifyResult);
  info(
    'setMatchCaptains',
    `Setting player ${shuffledPlayers[1].id} as captain for team b.`
  );
  await client()
    .updateMatchPlayer(match.id, shuffledPlayers[1].id, {
      team: 2,
      captain: true,
    })
    .then(verifyResult);
};

const matchPlayerTimeouts = new Map<string, NodeJS.Timeout>();
export const setPlayerExpireTimer = (player: MatchPlayersRow) => {
  const matchPlayerId = player.player_id.concat(player.match_id.toString());
  clearTimeout(matchPlayerTimeouts.get(matchPlayerId));
  const timeout = setTimeout(async () => {
    const match = await client().getMatch(player.match_id).then(verifySingleResult);
    if (match.status === MatchStatus.Open) {
      info(
        'setPlayerExpireTimer',
        `Player ${player.player_id} expired for match ${match.id}`
      );
      await client().deleteMatchPlayer(match.id, player.player_id);
      if (isDiscordMatch(match)) {
        await sendChannelMessage(match.config.channel, {
          content: `<@${player.player_id}> were removed from match ${match.id} (expire time ran off).`,
        });
      }
    }
  }, moment(player.expire_at).diff(moment()));
  matchPlayerTimeouts.set(matchPlayerId, timeout);
};

export const setPlayerReadyTimer = (match: MatchesJoined) => {
  setTimeout(async () => {
    const timedOutMatch = await client().getMatch(match.id).then(verifySingleResult);
    if (timedOutMatch.status === MatchStatus.Summoning) {
      info('handleMatchSummon', `Match ${match.id} timed out while summoning`);
      await client().deleteMatchPlayersForMatchId(
        timedOutMatch.id,
        timedOutMatch.teams.filter((player) => !player.ready)
      );
      await reopenMatch(timedOutMatch);
    }
  }, moment(match.ready_at).diff(moment()));
};

export const removePlayerFromOtherMatches = async (player: MatchPlayersRow) => {
  const openMatches = await client().getStagingMatches().then(verifyResult);
  await client().deleteMatchPlayersForPlayerId(
    player.player_id,
    openMatches.filter((m) => m.id !== player.match_id)
  );
};

export const fetchPlayerName = async (playerId: string | undefined) => {
  if (playerId) {
    const { data } = await client().getPlayer(playerId);
    if (data) {
      return data.full_name;
    }
  }
  return 'Player';
};
