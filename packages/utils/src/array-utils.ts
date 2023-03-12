import { PlayersRow } from '@bf2-matchmaking/types';

export const shuffleArray = <T = unknown>(array: Array<T>) => {
  const clonedArray = [...array];
  for (let i = clonedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clonedArray[i], clonedArray[j]] = [clonedArray[j], clonedArray[i]];
  }
  return clonedArray;
};

interface FullName {
  full_name: string;
}
export const compareFullName = (nameA: FullName, nameB: FullName) =>
  nameA.full_name.localeCompare(nameB.full_name);

interface UpdatedAt {
  updated_at: string;
}
export const compareUpdatedAt = (dateA: UpdatedAt, dateB: UpdatedAt) =>
  dateA.updated_at.localeCompare(dateB.updated_at);
