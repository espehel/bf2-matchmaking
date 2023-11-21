import { Form } from '@remix-run/react';
import { FC } from 'react';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { usePlayer } from '~/state/PlayerContext';
import moment from 'moment';
import ActionButton from '~/components/form/ActionButton';

interface Props {
  match: MatchesJoined;
}

const PlayerActions: FC<Props> = ({ match }) => {
  const { getMatchPlayer } = usePlayer();
  const matchPlayer = getMatchPlayer(match);

  return (
    <div className="section grow flex flex-col gap-2 h-min w-1/3">
      {match.status === MatchStatus.Open && matchPlayer && (
        <ActionButton action="./leave" className="leave-button">
          Leave match
        </ActionButton>
      )}
      {match.status === MatchStatus.Open && !matchPlayer && (
        <ActionButton action="./join">Join match</ActionButton>
      )}
      {matchPlayer && matchPlayer.expire_at && match.status === MatchStatus.Open && (
        <div>
          <ActionButton action={`./players/${matchPlayer.player_id}/renew`}>
            Renew expire
          </ActionButton>
          <p>
            You will automatically be removed from queue at{' '}
            {moment(matchPlayer.expire_at).format('HH:mm:ss')}
          </p>
        </div>
      )}
    </div>
  );
};

interface ActionProps {
  action: string;
  name: string;
  disabled?: boolean;
  className?: string;
}
const Action: FC<ActionProps> = ({ action, name, disabled, className }) => (
  <Form method="post" action={action} replace>
    <button type="submit" className={className || 'filled-button'} disabled={disabled}>
      {name}
    </button>
  </Form>
);

export default PlayerActions;
