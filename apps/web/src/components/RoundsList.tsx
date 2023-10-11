'use client';
import RoundItem from './RoundItem';
import { RoundsJoined } from '@bf2-matchmaking/types';

interface Props {
  rounds: Array<RoundsJoined>;
}
export default function RoundsList({ rounds }: Props) {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <ul className="flex flex-col gap-4">
        {rounds.map((round) => (
          <RoundItem key={round.id} round={round} />
        ))}
      </ul>
    </section>
  );
}
