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
  nameA.player.full_name.localeCompare(nameB.player.full_name);
export const compareIsCaptain = (mpA: MatchPlayersRow, mpB: MatchPlayersRow) =>
  Number(mpB.captain) - Number(mpA.captain);

interface UpdatedAt {
  updated_at: string;
}
export const compareUpdatedAt = (dateA: UpdatedAt, dateB: UpdatedAt) =>
  dateA.updated_at.localeCompare(dateB.updated_at);

export const mapIndexToEmoji = (index: number) =>
  ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].at(index) || '0️⃣';
