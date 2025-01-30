import { Transform } from 'node:stream';
import { TransformCallback } from 'stream';

export class SSEStream extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    });
  }

  _transform(message: Message, _encoding: BufferEncoding, done: TransformCallback) {
    if (message.comment) {
      this.push(`: ${message.comment}\n`);
    }
    if (message.event) {
      this.push(`event: ${message.event}\n`);
    }
    if (message.id) {
      this.push(`id: ${message.id}\n`);
    }
    if (message.retry) {
      this.push(`retry: ${message.retry}\n`);
    }
    if (message.data) {
      this.push(toDataString(message.data));
    }
    done();
  }
}

interface Message<T = string | Record<string, unknown>> {
  data: T;
  comment?: string;
  event?: string;
  id?: string;
  retry?: number;
}

function toDataString(data: string | Record<string, unknown>): string {
  if (typeof data === 'object') {
    return toDataString(JSON.stringify(data));
  }

  return data
    .split(/\r\n|\r|\n/)
    .map((line) => `data: ${line}\n\n`)
    .join('');
}
