import { createMatchApi } from '@bf2-matchmaking/services/matches/Match';
import { createMatchService } from '@bf2-matchmaking/services/matches';
import { createClient } from '@/lib/supabase/supabase-server';

export const matchApi = createMatchApi(createClient);
export const matchService = createMatchService(matchApi);
