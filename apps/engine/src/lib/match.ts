import { createServiceClient } from '@bf2-matchmaking/supabase';
import { createMatchApi } from '@bf2-matchmaking/services/matches/Match';
import { createMatchService } from '@bf2-matchmaking/services/matches';

export const matchApi = createMatchApi(createServiceClient());
export const matchService = createMatchService(matchApi);
