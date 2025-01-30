import { SSEStream } from '../SSEStream';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';

export class GatherEventStream extends SSEStream {
  writeEvent(event: StreamEventReply) {
    this.write({ event: 'data', data: event });
  }
  writeHeartbeat() {
    this.write({ event: 'heartbeat', data: 'ping' });
  }
}
