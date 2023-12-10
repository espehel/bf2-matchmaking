import { MatchPlayersRow, TeamPlayer } from '@bf2-matchmaking/types';

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
export const compareIsCaptain = (mpA: MatchPlayersRow, mpB: MatchPlayersRow) =>
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
