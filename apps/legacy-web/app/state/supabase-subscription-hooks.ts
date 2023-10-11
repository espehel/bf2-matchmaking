import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database, MatchesRow, MatchPlayersRow, RoundsRow } from '@bf2-matchmaking/types';
import { useEffect } from 'react';
import {
  RealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';

export const useSubscribeMatchInsert = (
  callback: (payload: RealtimePostgresInsertPayload<MatchesRow>) => void
) => {
  const supabase = useSupabaseClient<Database>();
  useEffect(() => {
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, callback)
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);
};

export const useSubscribeMatchUpdate = (
  callback: (payload: RealtimePostgresUpdatePayload<MatchesRow>) => void
) => {
  const supabase = useSupabaseClient<Database>();
  useEffect(() => {
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, callback)
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);
};
export const useSubscribeMatchPlayer = (
  callback: (payload: RealtimePostgresChangesPayload<MatchPlayersRow>) => void
) => {
  const supabase = useSupabaseClient<Database>();
  useEffect(() => {
    const channel = supabase
      .channel('public:match_players')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_players' },
        callback
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'match_players' },
        callback
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_players' },
        callback
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);
};

export const useSubscribeRounds = (
  callback: (payload: RealtimePostgresInsertPayload<RoundsRow>) => void
) => {
  const supabase = useSupabaseClient<Database>();
  useEffect(() => {
    const channel = supabase
      .channel('public:rounds')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rounds' }, callback)
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);
};
