import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import {
  closeMatch,
  deleteMatch,
  finishMatch,
  reopenMatch,
} from '@/app/matches/[match]/actions';
import { closeMatch as createResults } from '@/app/results/[match]/actions';
import AsyncActionButton from '@/components/AsyncActionButton';
import SelectServerForm from '@/components/match/SelectServerForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import MatchMapsSelect from '@/components/match/MatchMapsSelect';

interface Props {
  match: MatchesJoined;
}

export default async function MatchActions({ match }: Props) {
  const { data: servers } = await supabase(cookies).getServers();
  const { data: maps } = await supabase(cookies).getMaps();

  const isScheduled = match.status === MatchStatus.Scheduled;
  const isOngoing = match.status === MatchStatus.Ongoing;
  const isFinished = match.status === MatchStatus.Finished;
  const isClosed = match.status === MatchStatus.Closed;

  async function deleteMatchSA() {
    'use server';
    return deleteMatch(match.id);
  }
  async function finishMatchSA() {
    'use server';
    return finishMatch(match.id);
  }

  async function closeMatchSA() {
    'use server';
    return closeMatch(match.id);
  }
  async function createResultsSA() {
    'use server';
    return createResults(match.id);
  }

  async function reopenMatchSA() {
    'use server';
    return reopenMatch(match.id);
  }

  return (
    <div>
      <div className="divider mt-0" />
      <div className="flex gap-4 flex-col">
        {isScheduled && (
          <AsyncActionButton
            action={deleteMatchSA}
            successMessage="Match deleted."
            errorMessage="Failed to delete match"
            kind="btn-error"
          >
            Delete match
          </AsyncActionButton>
        )}
        {isOngoing && (
          <AsyncActionButton
            action={finishMatchSA}
            successMessage="Match closed and results created."
            errorMessage="Match set to finished but results not created"
          >
            Finish match
          </AsyncActionButton>
        )}
        {isFinished && (
          <div className="flex gap-4">
            <AsyncActionButton
              action={closeMatchSA}
              successMessage="Match closed without results."
              errorMessage="Failed to close match"
            >
              Close match
            </AsyncActionButton>
            <AsyncActionButton
              action={createResultsSA}
              successMessage="Match closed and results created."
              errorMessage="Failed to create results"
            >
              Create results
            </AsyncActionButton>
          </div>
        )}
        {isClosed && (
          <AsyncActionButton
            action={reopenMatchSA}
            successMessage="Match reopened."
            errorMessage="Failed to reopen match"
          >
            Reopen match
          </AsyncActionButton>
        )}
        {servers && !isClosed && <SelectServerForm match={match} servers={servers} />}
        {maps && !isClosed && <MatchMapsSelect match={match} maps={maps} />}
      </div>
    </div>
  );
}
