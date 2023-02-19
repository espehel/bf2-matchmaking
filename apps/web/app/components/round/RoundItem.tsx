import React, { FC, useState } from 'react';
import { useFirstRenderDefault } from '../../state/ssr-hooks';
import { RoundsJoined } from '@bf2-matchmaking/types';
import { UnmountClosed } from 'react-collapse';
import RoundSummary from '~/components/round/RoundSummary';
import { useUser } from '@supabase/auth-helpers-react';

interface Props {
  round: RoundsJoined;
}

const RoundItem: FC<Props> = ({ round }) => {
  const user = useUser();
  const [isSummaryOpen, setSummaryOpen] = useState(false);
  const date = useFirstRenderDefault(round.created_at, () =>
    new Date(round.created_at).toLocaleTimeString()
  );

  if (!round.si || !round.pl) {
    return null;
  }

  return (
    <li className="border rounded w-full">
      <button
        className="flex gap-4 p-4 w-full"
        onClick={() => setSummaryOpen(!isSummaryOpen)}
        disabled={!user}
      >
        <div className="mr-auto text-left">
          <p className="text-xl">{round.map.name}</p>
          <p className="text-sm">{date}</p>
        </div>
        <div>
          <p className="text-md font-bold">{round.team1_name}</p>
          <p className="text-md">{round.team1_tickets}</p>
        </div>
        <div>
          <p className="text-md font-bold">{round.team2_name}</p>
          <p className="text-md">{round.team2_tickets}</p>
        </div>
      </button>
      <UnmountClosed isOpened={isSummaryOpen}>
        <RoundSummary round={round} />
      </UnmountClosed>
    </li>
  );
};

export default RoundItem;
