import React, { FC } from 'react';
import { loader } from '~/routes/matches/$matchId';
import { useLoaderData } from '@remix-run/react';
import RoundItem from '~/components/round/RoundItem';

const RoundsList: FC = () => {
  const { rounds } = useLoaderData<typeof loader>();
  if (!rounds || rounds.length === 0) {
    return null;
  }
  return (
    <section className="section w-full">
      <h2 className="text-xl">Rounds</h2>
      <ul className="flex flex-col gap-4">
        {rounds.map((round) => (
          <RoundItem key={round.id} round={round} />
        ))}
      </ul>
    </section>
  );
};

export default RoundsList;
