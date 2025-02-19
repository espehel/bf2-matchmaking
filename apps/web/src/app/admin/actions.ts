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
export async function resetEngine() {
  const result = await api.v2.adminResetEngine();
  if (!result.error) {
    revalidatePath('/admin');
  }
  return result;
}
export async function resetServers() {
  const result = await api.v2.adminResetServers();
  if (!result.error) {
    revalidatePath('/admin');
  }
  return result;
}
