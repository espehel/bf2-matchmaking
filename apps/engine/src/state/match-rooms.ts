import { client, realtimeClient } from '@bf2-matchmaking/supabase';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { info } from '@bf2-matchmaking/logging';

const realtime = realtimeClient();

export async function joinMatchRoom(match: MatchesJoined) {
  const realtimeMatch = await realtime.getRealtimeMatch(match, 'engine');
  realtimeMatch.listenActivePlayers(async (players) => {
    if (match.players.every((player) => players.includes(player.id))) {
      info(
        'joinRoom',
        `Match ${match.id}: All players active, setting status to Drafting`
      );
      await client().updateMatch(match.id, { status: MatchStatus.Drafting });
    }
  });
}

export async function broadcastMatchStart(match: MatchesJoined) {
  const realtimeMatch = await realtime.getRealtimeMatch(match, 'engine');
  await realtimeMatch.broadcastStatusUpdate(MatchStatus.Ongoing);
}
export function leaveMatchRoom(match: MatchesJoined) {
  realtime.leaveRealtimeMatch(match);
}
