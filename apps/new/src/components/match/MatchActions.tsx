'use client';
import { MatchesJoined, MatchStatus, ServersJoined } from '@bf2-matchmaking/types';
import { closeMatch, finishMatch, reopenMatch } from '@/app/matches/[match]/actions';
import { closeMatch as createResults } from '@/app/results/[match]/actions';
import AsyncActionButton from '@/components/AsyncActionButton';
import SelectServerForm from '@/components/match/SelectServerForm';

interface Props {
  match: MatchesJoined;
  servers: Array<ServersJoined> | null;
}

export default function MatchActions({ match, servers }: Props) {
  const isOngoing = match.status === MatchStatus.Ongoing;
  const isFinished = match.status === MatchStatus.Finished;
  const isClosed = match.status === MatchStatus.Closed;

  return (
    <div className="flex gap-4 flex-col">
      {isOngoing && (
        <AsyncActionButton
          action={() => finishMatch(match.id)}
          successMessage="Match closed and results created."
          errorMessage="Match set to finished but results not created"
        >
          Finish match
        </AsyncActionButton>
      )}
      {isFinished && (
        <div className="flex gap-4">
          <AsyncActionButton
            action={() => closeMatch(match.id)}
            successMessage="Match closed without results."
            errorMessage="Failed to close match"
          >
            Close match
          </AsyncActionButton>
          <AsyncActionButton
            action={() => createResults(match.id)}
            successMessage="Match closed and results created."
            errorMessage="Failed to create results"
          >
            Create results
          </AsyncActionButton>
        </div>
      )}
      {isClosed && (
        <AsyncActionButton
          action={() => reopenMatch(match.id)}
          successMessage="Match reopened."
          errorMessage="Failed to reopen match"
        >
          Reopen match
        </AsyncActionButton>
      )}
      {servers && isOngoing && <SelectServerForm match={match} servers={servers} />}
    </div>
  );
}
