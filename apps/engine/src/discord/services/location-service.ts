import { LocationEmoji } from '@bf2-matchmaking/types';
import { MessageReaction } from 'discord.js';

let serverLocations: Map<LocationEmoji, string> = new Map([
  [LocationEmoji.Amsterdam, 'ams'],
  [LocationEmoji.Frankfurt, 'fra'],
  [LocationEmoji.Warsaw, 'waw'],
  [LocationEmoji.Stockholm, 'sto'],
  [LocationEmoji.Miami, 'mia'],
  [LocationEmoji.NewYork, 'ewr'],
]);

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

export function getValidEmojis() {
  return [...serverLocations.keys(), LocationEmoji.Existing];
}
export function isValidReaction(reaction: MessageReaction) {
  return (
    Array.from(serverLocations.keys()).some((k) => k === reaction.emoji.name) ||
    reaction.emoji.name === LocationEmoji.Existing
  );
}
