import { error, info } from '@bf2-matchmaking/logging';
import Queue from 'better-queue';

const queue = new Queue(
  async (fn: Function, cb) => {
    info('fastq', 'Executing queue');
    const result = await fn();
    cb(null, result);
  },
  { concurrent: 1 }
);

queue.on('error', (e) => error('message-queue', e));
queue.on('empty', () => info('message-queue', 'Queue emptied'));
queue.on('drain', () => info('message-queue', 'Queue drained'));
queue.on('task_queued', () => info('message-queue', 'Task queued'));
queue.on('task_accepted', () => info('message-queue', 'Task accepted'));
queue.on('task_started', () => info('message-queue', 'Task started'));
queue.on('task_finish', () => info('message-queue', 'Task finished'));
queue.on('task_failed', () => info('message-queue', 'Task failed'));

export const pushQueue = (fn: Function) => {
  queue.push(fn);
};
