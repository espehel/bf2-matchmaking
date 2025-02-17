import 'dotenv/config';
import { gql, GraphQLClient } from 'graphql-request';
import { assertObj } from '@bf2-matchmaking/utils';

assertString(process.env.RAILWAY_API_TOKEN, 'RAILWAY_API_TOKEN is required');
assertString(process.env.RAILWAY_ENVIRONMENT_ID, 'RAILWAY_ENVIRONMENT_ID is required');
assertString(process.env.RAILWAY_PROJECT_ID, 'PROJECT_ID is required');
const ENDPOINT = 'https://backboard.railway.app/graphql/v2';

type Edges<T> = Array<{ node: T }>;

interface LatestDeployment {
  id: string;
  status: string;
}

interface ServiceNode {
  id: string;
  name: string;
  serviceInstances: ServiceInstances;
}

interface ServiceInstanceNode {
  latestDeployment: LatestDeployment;
  serviceId: string;
}

interface ServiceInstances {
  edges: Edges<ServiceInstanceNode>;
}

interface Environment {
  serviceInstances: ServiceInstances;
}

const graphqlClient = new GraphQLClient(ENDPOINT, {
  headers: {
    Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
  },
  cache: 'no-cache',
});

export async function getServices() {
  let query = gql`
    query getServices($id: String!) {
      environment(id: $id) {
        serviceInstances {
          edges {
            node {
              latestDeployment {
                id
                status
              }
              serviceId
            }
          }
        }
      }
    }
  `;

  const variables = {
    id: process.env.RAILWAY_ENVIRONMENT_ID,
  };
  return graphqlClient.request<{ environment: Environment }>({
    document: query,
    variables,
  });
}

async function getServiceByName(serviceName: string) {
  const query = gql`
    query getServices($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges {
                  node {
                    latestDeployment {
                      id
                      status
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    projectId: process.env.RAILWAY_PROJECT_ID,
  };

  const result = await graphqlClient.request<{
    project: {
      services: {
        edges: Edges<ServiceNode>;
      };
    };
  }>({
    document: query,
    variables,
  });
  const service = result.project.services.edges.find(
    (service) => service.node.name === serviceName
  );
  assertObj(service, `Service with name ${serviceName} not found`);

  return service;
}

async function getServiceInstance(serviceId: string) {
  const query = gql`
    query serviceInstance($environmentId: String!, $serviceId: String!) {
      serviceInstance(environmentId: $environmentId, serviceId: $serviceId) {
        id
      }
    }
  `;

  const variables = {
    serviceId: serviceId,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
  };
  const result = await graphqlClient.request<{ serviceInstance: { id: string } }>({
    document: query,
    variables,
  });
  return result.serviceInstance.id;
}

export async function deploymentInstanceRestart(deploymentId: string, serviceId: string) {
  try {
    const { service } = await getService(serviceId);
    console.log(`Service ${service.name}, Deployment ${deploymentId} restarting...`);
    let query = gql`
      mutation deploymentRestart($deploymentId: String!) {
        deploymentRestart(id: $deploymentId)
      }
    `;
    let variables = {
      deploymentId: deploymentId,
    };
    const result = await graphqlClient.request<{ deploymentRestart: boolean }>({
      document: query,
      variables,
    });
    console.log(`Service ${service.name}, Deployment ${deploymentId} restart finished`);
    return result;
  } catch (error) {
    console.log(`Deployment ${deploymentId} restart failed with error: ${error}`);
  }
}

export async function restartServiceByName(name: string) {
  const service = await getServiceByName(name);
  const latestDeployment =
    service.node.serviceInstances.edges.at(0)?.node.latestDeployment;
  if (!latestDeployment || latestDeployment.status !== 'SUCCESS') {
    throw new Error(`Service ${name} has no successful deployment`);
  }
  return deploymentInstanceRestart(latestDeployment.id, service.node.id);
}

async function getService(serviceId: string) {
  let query = gql`
    query getService($id: String!) {
      service(id: $id) {
        name
      }
    }
  `;

  const variables = {
    id: serviceId,
  };
  return graphqlClient.request<{ service: { name: string } }>({
    document: query,
    variables,
  });
}

export async function runService(serviceId: string) {
  const latestDeploymentId = await getServiceInstance(serviceId);
  let query = gql`
    mutation deploymentInstanceExecutionCreate($serviceInstanceId: String!) {
      deploymentInstanceExecutionCreate(input: { serviceInstanceId: $serviceInstanceId })
    }
  `;

  const variables = {
    serviceInstanceId: latestDeploymentId,
  };
  return graphqlClient.request<{
    deploymentInstanceExecutionCreate: boolean;
  }>({
    document: query,
    variables,
  });
}

export function assertString(
  object: unknown,
  message?: string
): asserts object is string {
  if (typeof object !== 'string') {
    throw new Error(message || `${typeof object} is not a string`);
  }
}
