export const LOBBY_CHANNEL = '20342';
export const QUEUE_CHANNEL = '42497';
export const BOT_CHANNEL = '42497';

//TODO: should password be exposed on the page? only show if user is on the discord server?
export const TEAMSPEAK_SERVER_URI = `ts3server://oslo21.spillvert.no?port=10014&cid=${QUEUE_CHANNEL}`; //&password=${process.env.TEAMSPEAK_PASSWORD}`;
