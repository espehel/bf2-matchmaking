import ms, { StringValue } from 'ms';
import { CronExpressionParser } from 'cron-parser';
import { assertObj } from '@bf2-matchmaking/utils';
import { EventEmitter } from 'node:events';

type EventName = 'scheduled' | 'started' | 'finished' | 'failed' | 'stopped';
declare interface Job {
  on(event: 'scheduled', listener: (name: string, time: string) => void): this;
  on(event: 'started', listener: (name: string) => void): this;
  on(event: 'finished', listener: (name: string) => void): this;
  on(event: 'failed', listener: (name: string, err: unknown) => void): this;
  on(event: 'stopped', listener: (name: string) => void): this;
}
export type Task = () => void | Promise<void>;
class Job extends EventEmitter {
  timeout: NodeJS.Timeout | undefined;
  constructor(public name: string, public task: Task) {
    super();
  }
  emit(eventName: EventName, ...args: unknown[]): boolean {
    return super.emit(eventName, this.name, ...args);
  }
}
class CronJob extends Job {
  constructor(name: string, private expression: string, task: Task) {
    super(name, task);
  }
  schedule() {
    const timeoutAt = CronExpressionParser.parse(this.expression).next();
    this.emit('scheduled', timeoutAt.toISOString());
    this.timeout = setTimeout(async () => {
      try {
        this.emit('started');
        await this.task();
        this.emit('finished');
      } catch (e) {
        this.emit('failed', e);
      } finally {
        this.schedule();
      }
    }, timeoutAt.getTime() - Date.now());
    return this;
  }
  setExpression(expression: string) {
    this.expression = expression;
    clearTimeout(this.timeout);
    this.schedule();
  }
}
class IntervalJob extends Job {
  constructor(name: string, private interval: StringValue, task: Task) {
    super(name, task);
  }
  schedule() {
    this.emit('scheduled', this.interval);
    this.timeout = setInterval(async () => {
      try {
        this.emit('started');
        await this.task();
        this.emit('finished');
      } catch (e) {
        this.emit('failed', e);
      }
    }, ms(this.interval));
    return this;
  }
  setInterval(interval: StringValue) {
    this.interval = interval;
    clearTimeout(this.timeout);
    this.schedule();
  }
}

const cronJobs = new Map<string, CronJob>();
const intervalJobs = new Map<string, IntervalJob>();
export function Jobs(name: string) {
  return {
    setCron: (expression: string, task: Task) => {
      const job = new CronJob(name, expression, task).schedule();
      cronJobs.set(name, job);
      return job;
    },
    setInterval: (interval: StringValue, task: Task) => {
      const job = new IntervalJob(name, interval, task).schedule();
      intervalJobs.set(name, job);
      return job;
    },
    getCron() {
      const job = cronJobs.get(name);
      assertObj(job, `Cron Job ${name} not found`);
      return job;
    },
    getInterval() {
      const job = intervalJobs.get(name);
      assertObj(job, `Interval Job ${name} not found`);
      return job;
    },
  };
}
