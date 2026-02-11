import { SSEStream } from '../SSEStream';
import { LiveInfo } from '@bf2-matchmaking/types';

export class ServerInfoStream extends SSEStream {
  writeInfo(info: LiveInfo) {
    this.write({ event: 'data', data: info });
  }
  writeHeartbeat() {
    this.write({ event: 'heartbeat', data: 'ping' });
  }
}
