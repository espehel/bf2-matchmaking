import { restartAllActiveServices } from './lib';

restartAllActiveServices()
  .then(() => console.log('Services Restarted'))
  .catch((e) => console.log(e))
  .finally(() => process.exit());
