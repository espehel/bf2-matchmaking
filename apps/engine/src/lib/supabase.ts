import { players as p } from '@bf2-matchmaking/supabase/players';
import { createServiceClient } from '@bf2-matchmaking/supabase';

export const players = p(createServiceClient());
