import { createMatchApi } from '@bf2-matchmaking/services/matches/Match';
import { createMatchService } from '@bf2-matchmaking/services/matches';
import { createClient, matches } from '@/lib/supabase/supabase-server';
import { ActionResult, Option } from '@/lib/types/form';
import { revalidatePath } from 'next/cache';

export const matchApi = createMatchApi(createClient);
export const matchService = createMatchService(matchApi);
