import cron from 'node-cron';
import { resetServers } from '@bf2-matchmaking/services/server';
import { error, info } from '@bf2-matchmaking/logging';

export async function _resetServers() {
  try {
    const result = await resetServers();
    info(
      '_resetServers',
      `Reset servers: ${Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}`
    );
  } catch (e) {
    error('_resetServers', e);
  }
}

export const resetServersTask = cron.schedule('30 7 * * *', _resetServers, {
  scheduled: false,
});
