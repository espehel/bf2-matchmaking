import 'dotenv/config';
import { gql, GraphQLClient } from 'graphql-request';

assertString(process.env.RAILWAY_API_TOKEN, 'RAILWAY_API_TOKEN is required');
assertString(process.env.RAILWAY_ENVIRONMENT_ID, 'RAILWAY_ENVIRONMENT_ID is required');
const ENDPOINT = 'https://backboard.railway.app/graphql/v2';

interface LatestDeployment {
  id: string;
  status: string;
}

interface ServiceNode {
  latestDeployment: LatestDeployment;
  serviceId: string;
}

interface ServiceInstanceEdge {
  node: ServiceNode;
}

interface ServiceInstances {
  edges: ServiceInstanceEdge[];
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

async function getLatestDeployment(serviceId: string) {
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
    const result = await graphqlClient.request({ document: query, variables });
    console.log(`Service ${service.name}, Deployment ${deploymentId} restart finished`);
    return result;
  } catch (error) {
    console.log(`Deployment ${deploymentId} restart failed with error: ${error}`);
  }
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
  const latestDeploymentId = await getLatestDeployment(serviceId);
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
