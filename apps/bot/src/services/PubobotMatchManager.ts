import { MatchStatus } from '@bf2-matchmaking/types';
import { Embed } from 'discord.js';
import { PubobotMatch } from './PubobotMatch';

let pubobotMatches: Array<PubobotMatch> = [];
export function addMatch(match: PubobotMatch) {
  pubobotMatches = [...pubobotMatches.filter((m) => m.id !== match.id), match];
}
export function getPubobotId(embed: Embed) {
  return Number(embed?.footer?.text?.replace('Match id: ', '')) || null;
}
export function getPubobotMatch(embed: Embed) {
  return pubobotMatches.find((m) => m.id === getPubobotId(embed));
}
export function hasPubotId(
  id: number,
  status: MatchStatus.Summoning | MatchStatus.Drafting
) {
  return pubobotMatches.some((match) => match.id === id && match.getStatus() === status);
}
export function removeMatch(embed: Embed) {
  const id = getPubobotId(embed);
  if (id) {
    pubobotMatches = pubobotMatches.filter((m) => m.id !== id);
  }
  return id;
}
