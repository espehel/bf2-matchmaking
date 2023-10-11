'use server';
import { revalidatePath } from 'next/cache';
import { api } from '@bf2-matchmaking/utils';

export async function closeMatch(matchId: number) {
  const result = await api.rcon().postMatchResults(matchId);

  if (!result.error) {
    revalidatePath(`/results/${matchId}`);
  }
  return result;
}
