const basePath = 'https://bf2.top';

export const web = {
  basePath,
  eventPage: (eventId: number | string) => `${basePath}/events/${eventId}`,
  matchPage: (matchId: number | string, playerId?: string) =>
    `${basePath}/matches/${matchId}${playerId ? `?player=${playerId}` : ''}`,
  teamspeakPage: (id?: string) => {
    const url = new URL(`${basePath}/gather/register`);
    if (id) {
      url.searchParams.append('tsid', encodeURIComponent(id));
    }
    return url;
  },
};
