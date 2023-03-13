import React, { FC } from 'react';
import { MatchConfigsJoined, MatchesJoined } from '@bf2-matchmaking/types';
import { Link } from '@remix-run/react';
import ActionButton from '~/components/form/ActionButton';

interface Props {
  config: MatchConfigsJoined;
  match: MatchesJoined | null;

  hasJoined: boolean;
}

const getDraftText = (draft: string) => (draft === 'random' ? 'Random draft' : 'Captains draft');
const getMapDraftText = (draft: string) => (draft === 'random' ? 'Random' : 'Vote');

const QuickMatchSection: FC<Props> = ({ config, match, hasJoined }) => {
  return (
    <section
      className={`section flex flex-col items-center justify-center ${
        hasJoined ? 'border-green-500 hover:border-green-500' : ''
      }`}
    >
      <h2 className="text-xl mb-4">{config.name}</h2>
      <ActionButton
        className="join-button mb-4"
        disabled={hasJoined}
        action={`/matches/${match?.id}/join`}
        isNavigation
      >
        {hasJoined ? 'Waiting for players...' : 'Join'}
      </ActionButton>
      {hasJoined && (
        <ActionButton className="leave-button mb-4" action={`/matches/${match?.id}/leave`}>
          Leave
        </ActionButton>
      )}
      <div className="flex justify-between flex-wrap gap-x-4 w-full">
        {match && (
          <div>
            <span className="mr-1">Match:</span>
            <Link className="underline text-blue-800" to={`/matches/${match.id}`}>
              {match.id}
            </Link>
          </div>
        )}
        <div>
          <span className="mr-1">Discord:</span>
          <a className="underline text-blue-800" href={config.channel.uri}>
            {config.channel.name}
          </a>
        </div>
        <div>
          <span className="mr-1">Players:</span>
          <span>{`${match?.players.length || 0}/${config.size}`}</span>
        </div>
        <div>
          <span className="mr-1">Draft:</span>
          <span>{getDraftText(config.draft)}</span>
        </div>
        <div>
          <span className="mr-1">Map draft:</span>
          <span>{getMapDraftText(config.map_draft)}</span>
        </div>
      </div>
    </section>
  );
};

export default QuickMatchSection;
