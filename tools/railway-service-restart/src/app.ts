import {
  assertString,
  deploymentInstanceRestart,
  getServices,
} from '@bf2-matchmaking/railway';

assertString(process.env.RAILWAY_SERVICE_ID, 'RAILWAY_SERVICE_ID is required');

async function restartAllActiveServices() {
  const { environment } = await getServices();
  for (const serviceInstance of environment.serviceInstances.edges) {
    if (serviceInstance.node.serviceId === process.env.RAILWAY_SERVICE_ID) {
      continue;
    }
    if (serviceInstance.node.latestDeployment.status === 'SUCCESS') {
      await deploymentInstanceRestart(
        serviceInstance.node.latestDeployment.id,
        serviceInstance.node.serviceId
      );
    }
  }
}

restartAllActiveServices()
  .then(() => console.log('Services Restarted'))
  .catch((e) => console.log(e))
  .finally(() => process.exit());
