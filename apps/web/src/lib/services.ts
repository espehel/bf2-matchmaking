import { createClient } from '@/lib/supabase/supabase-server';
import { createResultsService } from '@bf2-matchmaking/services/results';

export const resultsService = createResultsService(createClient);
