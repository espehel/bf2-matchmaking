import { getClient } from '../client';

interface StreamMessageReply {
  id: string;
  message: Record<string, string>;
}

export function stream(key: string) {
  const add = async (event: string, value: string) => {
    const client = await getClient();
    return client.XADD(key, '*', { [event]: value });
  };

  const readAll = async (): Promise<Array<StreamMessageReply>> => {
    const client = await getClient();
    return client.XRANGE(key, '-', '+');
  };

  const del = async () => {
    const client = await getClient();
    return client.DEL(key);
  };
  return {
    add,
    readAll,
    del,
  };
}
