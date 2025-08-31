'use server';
import { api } from '@bf2-matchmaking/utils';
import { getValues } from '@bf2-matchmaking/utils/form';
import { revalidatePath } from 'next/cache';

export async function setGatherServer(data: FormData) {
  const { serverSelect, configId } = getValues(data, 'serverSelect', 'configId');
  const result = await api.v2.postGatherServer(configId, serverSelect);
  if (!result.error) {
    revalidatePath('/gather');
  }
  return result;
}
