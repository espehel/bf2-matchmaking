import { getClient } from './client';

export async function getChannelUsers(cid: string) {
  const client = await getClient();
  return client.clientList({ cid });
}

export async function getUser(userId: string) {
  const client = await getClient();
  return client.getClientByUid(userId);
}
