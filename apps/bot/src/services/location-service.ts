import { api, verify } from '@bf2-matchmaking/utils';
import { error, info } from '@bf2-matchmaking/logging';
import { LocationEmoji } from '@bf2-matchmaking/types';
import { MessageReaction } from 'discord.js';

let serverLocations: Map<LocationEmoji, string> = new Map();
const validLocations: Array<[LocationEmoji, string]> = [
  [LocationEmoji.Amsterdam, 'ams'],
  [LocationEmoji.Frankfurt, 'fra'],
  [LocationEmoji.Warsaw, 'waw'],
  [LocationEmoji.Stockholm, 'sto'],
  [LocationEmoji.Miami, 'mia'],
  [LocationEmoji.NewYork, 'ewr'],
];
export function loadServerLocations() {
  api
    .platform()
    .getLocations()
    .then(verify)
    .then((locations) => {
      serverLocations = new Map<LocationEmoji, string>(
        validLocations.filter(([, id]) => locations.some((l) => l.id === id))
      );
      info('loadServerLocations', `Loaded ${serverLocations.size} server locations`);
    })
    .catch((e) => {
      error('loadServerLocations', e);
    });
}

export function getServerLocationEmojis() {
  return Array.from(serverLocations.keys());
}

export function getServerLocation(reaction: string | null | undefined) {
  if (!reaction) {
    return undefined;
  }
  if (reaction === LocationEmoji.Existing) {
    return 'existing';
  }
  return serverLocations.get(reaction as LocationEmoji);
}

export function isValidReaction(reaction: MessageReaction) {
  return (
    Array.from(serverLocations.keys()).some((k) => k === reaction.emoji.name) ||
    reaction.emoji.name === LocationEmoji.Existing
  );
}
