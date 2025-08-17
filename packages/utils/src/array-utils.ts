import { MatchPlayersInsert, TeamPlayer } from '@bf2-matchmaking/types';
import { Option } from 'web/src/lib/types/form';

export const shuffleArray = <T = unknown>(array: Array<T>) => {
  const clonedArray = [...array];
  for (let i = clonedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clonedArray[i], clonedArray[j]] = [clonedArray[j], clonedArray[i]];
  }
  return clonedArray;
};

export const compareFullName = (nameA: TeamPlayer, nameB: TeamPlayer) =>
  nameA.player.nick.localeCompare(nameB.player.nick);
export const compareIsCaptain = (mpA: MatchPlayersInsert, mpB: MatchPlayersInsert) =>
  Number(mpB.captain) - Number(mpA.captain);

interface UpdatedAt {
  updated_at: string;
}
export const compareUpdatedAt = (dateA: UpdatedAt, dateB: UpdatedAt) =>
  dateA.updated_at.localeCompare(dateB.updated_at);

export const mapIndexToEmoji = (index: number) =>
  ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].at(index) || '0️⃣';

export const isUniqueObject = <T extends { id: string | number }>(
  value: T,
  index: number,
  self: Array<T>
) => self.findIndex((o) => o.id === value.id) === index;

export const isUniqueString = (value: string, index: number, self: Array<string>) =>
  self.findIndex((v) => v === value) === index;

export const isUniqueTupleValue = (
  [, value]: [string, string],
  index: number,
  self: Array<[string, string]>
) => self.findIndex(([, v]) => v === value) === index;

export const toTuple = <T>(array: Array<T>): [T, T] | null =>
  array.length === 2 ? [array[0], array[1]] : null;

export function groupBy<T>(
  array: Array<T>,
  groupFn: (el: T) => string
): Array<[string, Array<T>]> {
  const group = array.reduce<Record<string, Array<T>>>((groups, curr) => {
    if (groups[groupFn(curr)]) {
      return { ...groups, [groupFn(curr)]: [...groups[groupFn(curr)], curr] };
    } else {
      return { ...groups, [groupFn(curr)]: [curr] };
    }
  }, {});

  return Object.entries(group);
}

export function hasEqualElements<T>(a: Array<T>, b: Array<T>) {
  return a.length === b.length && a.every((element) => b.includes(element));
}

export function sortByName<T extends { name: string }>(array: Array<T>): Array<T> {
  return [...array].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortOptions(array: Array<Option>): Array<Option> {
  return [...array].sort(([, a], [, b]) => a.toString().localeCompare(b.toString()));
}
