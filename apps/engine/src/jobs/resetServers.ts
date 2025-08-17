import { resetServers } from '@bf2-matchmaking/services/server';
import { error, info } from '@bf2-matchmaking/logging';
import { Job } from '@bf2-matchmaking/scheduler';

async function _resetServers() {
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

export function scheduleResetServersJob() {
  Job.create('resetServers', _resetServers)
    .on('failed', (name, err) => error(name, err))
    .schedule({ cron: '30 7 * * *' });
}
