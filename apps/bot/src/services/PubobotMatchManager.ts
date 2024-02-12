import { MatchStatus } from '@bf2-matchmaking/types';
import { Embed } from 'discord.js';
import { PubobotMatch } from './PubobotMatch';
import { info } from '@bf2-matchmaking/logging';

let pubobotMatches: Array<PubobotMatch> = [];
export function addMatch(match: PubobotMatch) {
  info('PubobotMatchManager', `Pubomatch ${match.id} added`);
  pubobotMatches = [...pubobotMatches.filter((m) => m.id !== match.id), match];
}
export function getPubobotId(embed: Embed) {
  return Number(embed?.footer?.text?.replace('Match id: ', '')) || null;
}
export function getPubobotMatch(embed: Embed) {
  const id = getPubobotId(embed);
  const match = pubobotMatches.find((m) => m.id === id);
  info(
    'PubobotMatchManager',
    `Pubomatch ${id} fetched with status ${match?.getStatus()}`
  );
  return match;
}
export function hasPubotId(id: number, status: MatchStatus.Open | MatchStatus.Drafting) {
  const hasSome = pubobotMatches.some(
    (match) => match.id === id && match.getStatus() === status
  );
  info('PubobotMatchManager', `Pubomatch ${id} with status ${status} found=${hasSome}`);
  return hasSome;
}
export function removeMatch(embed: Embed) {
  const id = getPubobotId(embed);
  if (id) {
    pubobotMatches = pubobotMatches.filter((m) => m.id !== id);
  }
  return id;
}
