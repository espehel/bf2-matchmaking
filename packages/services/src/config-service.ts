import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { DiscordConfig, isDiscordConfig } from '@bf2-matchmaking/types';
import { json } from '@bf2-matchmaking/redis/json';
import { assertObj } from '@bf2-matchmaking/utils';

export async function getMatchConfig(configId: number | string) {
  if (await json(`config:${configId}`).exists()) {
    const config = await json<DiscordConfig>(`config:${configId}`).get();
    assertObj(config, 'Failed to get config from redis');
    return config;
  }

  const config = await client().getMatchConfig(20).then(verifySingleResult);
  if (!isDiscordConfig(config)) {
    throw new Error('Config does not contain discord channel');
  }
  await json(`config:${config.id}`).set(config);
  return config;
}
