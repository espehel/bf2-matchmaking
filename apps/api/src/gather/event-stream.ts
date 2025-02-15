import { stream } from '@bf2-matchmaking/redis/stream';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';
import { info } from '@bf2-matchmaking/logging';

export function waitForEvent(
  config: number | string,
  lastEvent: string,
  onEvent: (event: StreamEventReply) => void,
  onError: (err: Error) => void
) {
  let open = true;

  function eventListener(lastEvent: string) {
    stream(`gather:${config}:events`)
      .readEventsBlocking(lastEvent)
      .then((events) => {
        if (events === null) {
          info('waitForEvent', `Gather ${config}: Stream Timeout`);
          onError(new Error('Stream Timeout'));
          return;
        }
        let lastId = lastEvent;
        for (const event of events) {
          onEvent(event);
          lastId = event.id;
        }
        if (open) {
          setImmediate(() => eventListener(lastId));
        }
      })
      .catch(onError);
  }
  setImmediate(() => eventListener(lastEvent));

  return () => {
    open = false;
  };
}
