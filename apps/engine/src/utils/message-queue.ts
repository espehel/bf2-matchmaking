import { promise as fastq } from 'fastq';
import { error, info } from '@bf2-matchmaking/logging';

const queue = fastq<Function>((fn: Function) => {
  info('fastq', 'Executing queue');
  return fn();
}, 1);

queue.error((e) => error('message-queue', e));

export const pushQueue = (fn: Function) => {
  queue.push(fn);
};
