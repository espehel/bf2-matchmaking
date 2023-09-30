import React, { FC, useState } from 'react';
import { useFirstRenderDefault } from '../../state/ssr-hooks';
import { RoundsJoined } from '@bf2-matchmaking/types';
import { UnmountClosed } from 'react-collapse';
import RoundSummary from '~/components/round/RoundSummary';
import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from '@remix-run/react';

interface Props {
  round: RoundsJoined;
}

const RoundItem: FC<Props> = ({ round }) => {
  const user = useUser();
  const navigate = useNavigate();
  const [isSummaryOpen, setSummaryOpen] = useState(false);
  const date = useFirstRenderDefault(round.created_at, () =>
    new Date(round.created_at).toLocaleTimeString()
  );

  const onRoundClick = () => {
    if (user) {
      setSummaryOpen(!isSummaryOpen);
    } else {
      navigate('signin');
    }
  };

  if (!round.si || !round.pl) {
    return null;
  }

  return (
    <li className="border rounded w-full">
      <button className="flex gap-4 p-4 w-full" onClick={onRoundClick}>
        <div className="mr-auto text-left">
          <p className="text-xl">{round.map.name}</p>
          <p className="text-sm">{date}</p>
        </div>
        <div>
          <p className="text-md font-bold">{round.team1.name}</p>
          <p className="text-md">{round.team1_tickets}</p>
        </div>
        <div>
          <p className="text-md font-bold">{round.team2.name}</p>
          <p className="text-md">{round.team2_tickets}</p>
        </div>
      </button>
      <UnmountClosed isOpened={isSummaryOpen}>
        {user && <RoundSummary round={round} />}
        {!user && <p className="p-4">Sign in to see player scores.</p>}
      </UnmountClosed>
    </li>
  );
};

export default RoundItem;
