import ms, { StringValue } from 'ms';
import { CronExpressionParser } from 'cron-parser';
import { assertObj } from '@bf2-matchmaking/utils';
import { EventEmitter } from 'node:events';

type EventName = 'scheduled' | 'started' | 'finished' | 'failed' | 'stopped';
declare interface Job<I, O> {
  on(event: 'scheduled', listener: (name: string, timeoutAt: number) => void): this;
  on(event: 'started', listener: (name: string, input: I) => void): this;
  on(event: 'finished', listener: (name: string, output: O) => void): this;
  on(event: 'failed', listener: (name: string, err: unknown) => void): this;
  on(event: 'stopped', listener: (name: string) => void): this;
}
export type Task<I = undefined, O = unknown> = (input: I) => O | Promise<O>;
export interface ScheduleOptions<I = undefined> {
  cron?: string;
  interval?: StringValue;
  input: I;
}
function getTimeoutMs({ cron, interval }: Omit<ScheduleOptions, 'input'>) {
  const cronMs = cron
    ? CronExpressionParser.parse(cron).next().getTime() - Date.now()
    : Number.MAX_SAFE_INTEGER;

  const intervalMs = interval ? ms(interval) : Number.MAX_SAFE_INTEGER;

  if (cronMs === Number.MAX_SAFE_INTEGER && intervalMs === Number.MAX_SAFE_INTEGER) {
    throw new Error('No valid cron expression or interval provided');
  }
  return Math.min(cronMs, intervalMs);
}
class Job<I = undefined, O = unknown> extends EventEmitter {
  timeout: NodeJS.Timeout | undefined;
  constructor(public name: string, public task: Task<I, O>) {
    super();
  }
  emit(eventName: EventName, ...args: unknown[]): boolean {
    return super.emit(eventName, this.name, ...args);
  }
  schedule(
    options: I extends undefined ? Partial<ScheduleOptions<I>> : ScheduleOptions<I>
  ) {
    const timeoutMs = getTimeoutMs(options);
    const timeoutAt = Date.now() + timeoutMs;
    if (this.timeout) {
      this.stop();
    }
    this.timeout = setTimeout(async () => {
      this.timeout = undefined;
      try {
        this.emit('started', options.input);
        const result = await this.task(options.input as I);
        this.emit('finished', result);
      } catch (e) {
        this.emit('failed', e);
      } finally {
        this.schedule(options);
      }
    }, timeoutMs);
    this.emit('scheduled', timeoutAt);
    return this;
  }
  stop() {
    clearTimeout(this.timeout);
    this.emit('stopped');
  }
}

const jobs = new Map<string, Job<any, any>>();
export function createJob<I = undefined, O = unknown>(name: string, task: Task<I, O>) {
  const job = new Job(name, task);
  jobs.set(name, job);
  return job;
}
export function getJob(name: string) {
  const job = jobs.get(name);
  assertObj(job, `Cron Job ${name} not found`);
  return job;
}
