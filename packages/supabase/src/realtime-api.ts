import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

type ListenCB = (players: Array<string>) => void;
type ListenStatusCB = (status: MatchStatus) => void;

const matches: Map<number, RealtimeMatch> = new Map();
export function realtime(client: SupabaseClient) {
  return {
    getRealtimeMatch: async (match: MatchesJoined, user?: string) => {
      let realtimeMatch = matches.get(match.id);
      if (realtimeMatch && realtimeMatch.hasJoined()) {
        return matches.get(match.id) as RealtimeMatch;
      }

      realtimeMatch = await RealtimeMatch.open(client, match, user);
      matches.set(match.id, realtimeMatch);

      return realtimeMatch;
    },
    leaveRealtimeMatch: (match: MatchesJoined) => {
      const realtimeMatch = matches.get(match.id);
      if (realtimeMatch) {
        realtimeMatch.leave();
        matches.delete(match.id);
      }
    },
  };
}

export class RealtimeMatch {
  match: MatchesJoined;
  room: RealtimeChannel;

  constructor(match: MatchesJoined, room: RealtimeChannel) {
    this.match = match;
    this.room = room;
  }

  hasJoined() {
    return this.room.state === 'joined';
  }

  leave() {
    this.room.untrack();
  }
  broadcastStatusUpdate(status: MatchStatus) {
    return this.room.send({
      type: 'broadcast',
      event: 'status-updated',
      payload: { status },
    });
  }
  listenStatusUpdate(cb: ListenStatusCB) {
    this.room.on('broadcast', { event: 'status-updated' }, ({ payload }) => {
      cb(payload.status);
    });
  }
  listenActivePlayers(cb: ListenCB) {
    this.room.on('presence', { event: 'sync' }, () => {
      const newState = this.room.presenceState();
      cb(
        Object.keys(newState).filter((p) =>
          this.match.players.some((player) => player.id === p)
        )
      );
    });
  }
  static open(
    client: SupabaseClient,
    match: MatchesJoined,
    user?: string
  ): Promise<RealtimeMatch> {
    const room = client.channel(`room_${match.id}`, {
      config: {
        presence: {
          key: user,
        },
      },
    });
    return new Promise<RealtimeMatch>((resolve, reject) => {
      room.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const res = await room.track({});
          if (res === 'ok') {
            resolve(new RealtimeMatch(match, room));
          } else {
            reject(res);
          }
        }
      });
    });
  }
}
