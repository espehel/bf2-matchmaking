'use server';

import { getOptionalValues, getValueAsNumber } from '@bf2-matchmaking/utils/form';
import { configs } from '@/lib/supabase/supabase-server';
import { ActionResult } from '@/lib/types/form';
import { revalidatePath } from 'next/cache';

export async function updateConfig(formdData: FormData): Promise<ActionResult> {
  const configId = getValueAsNumber(formdData, 'id');
  const { channel, guild } = getOptionalValues(formdData, 'channel', 'guild');
  const result = await configs.update(configId, { channel: channel, guild });
  if (result.error) {
    console.error('Failed to update config', result.error);
    return {
      success: null,
      ok: false,
      error: 'Failed to update config',
    };
  }
  revalidatePath('/admin/configs');
  revalidatePath('/events');

  return {
    success: 'Config updated',
    ok: true,
    error: null,
  };
}
