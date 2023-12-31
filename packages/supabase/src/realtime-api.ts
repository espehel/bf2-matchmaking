import { MatchesJoined } from '@bf2-matchmaking/types';
import { REALTIME_PRESENCE_LISTEN_EVENTS, SupabaseClient } from '@supabase/supabase-js';

type ListenCB = (players: Array<string>) => void;

export function realtime(client: SupabaseClient) {
  return (match: MatchesJoined, user?: string) => {
    const room = client.channel(`room_${match.id}`, {
      config: {
        presence: {
          key: user,
        },
      },
    });

    return {
      join: () => {
        return new Promise<void>((resolve, reject) => {
          room.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              const res = await room.track({});
              if (res === 'ok') {
                resolve();
              } else {
                reject(res);
              }
            }
          });
        });
      },
      leave: async () => {
        await room.untrack();
      },
      listenActivePlayers: (cb: ListenCB) => {
        room.on('presence', { event: 'sync' }, () => {
          const newState = room.presenceState();
          cb(
            Object.keys(newState).filter((p) =>
              match.players.some((player) => player.id === p)
            )
          );
        });
      },
      listen: (event: REALTIME_PRESENCE_LISTEN_EVENTS, cb: ListenCB) => {
        switch (event) {
          case REALTIME_PRESENCE_LISTEN_EVENTS.SYNC: {
            room.on('presence', { event: 'sync' }, () => {
              const newState = room.presenceState();
              cb(Object.keys(newState));
            });
            break;
          }
          case REALTIME_PRESENCE_LISTEN_EVENTS.JOIN: {
            room.on(
              'presence',
              { event: 'join' },
              ({ key, newPresences, currentPresences }) => {
                console.log('join/currentPresences', key, currentPresences);
                console.log('join/newPresences', key, newPresences);
              }
            );
            break;
          }
          case REALTIME_PRESENCE_LISTEN_EVENTS.LEAVE: {
            room.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
              console.log('leave', key, leftPresences);
            });
          }
        }
      },
    };
  };
}
