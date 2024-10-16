'use server';
import { api } from '@bf2-matchmaking/utils';
import { revalidatePath } from 'next/cache';

export async function resetSystem() {
  const result = await api.v2.adminReset();
  if (!result.error) {
    revalidatePath('/admin');
  }
  return result;
}
