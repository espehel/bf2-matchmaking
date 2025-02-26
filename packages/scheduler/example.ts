import { createJob } from './src/scheduler';

export async function testTask(input: number) {
  console.log('starting task');
  const output = input * 2;
  console.log('task done');
  return output;
}

function scheduleTestTask() {
  createJob('closeOldMatches', testTask)
    .on('scheduled', (name, time) => console.log(name, `Scheduled at ${new Date(time)}`))
    .on('started', (name, input) => console.log(name, `Started with input ${input}`))
    .on('failed', (name, err) => console.log(name, err))
    .on('finished', (name, output) => console.log(name, `Finished with output ${output}`))
    .schedule({ interval: '10s', input: 5 });
}
scheduleTestTask();
