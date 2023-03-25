import { promise as fastq } from 'fastq';
import { error } from '@bf2-matchmaking/logging';

const queue = fastq<Function>((fn: Function) => fn(), 1);

queue.error((e) => error('message-queue', e));

export const pushQueue = (fn: Function) => {
  queue.push(fn);
};
