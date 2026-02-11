export const getEventSource = (url: string): EventSource => {
  const source = new EventSource(url);
  source.addEventListener('error', (event) => {
    console.error('SSE Error:', JSON.stringify(event));
  });
  return source;
};

//const basePath = 'http://localhost:5004';
const basePath = 'https://api.bf2.top';
const gathers = `${basePath}/gathers`;
const servers = `${basePath}/servers`;
export const api = {
  getGatherEventsStream: (config: number | string, start: string | undefined) =>
    getEventSource(`${gathers}/${config}/events/stream?start=${start}`),
  getServerLiveStream: (address: string) =>
    getEventSource(`${servers}/${address}/stream`),
};
