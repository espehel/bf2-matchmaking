import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import {
  closeMatch,
  deleteMatch,
  finishMatch,
  reopenMatch,
  createResults,
  startMatch,
} from '@/app/matches/[match]/actions';
import ActionButton from '@/components/ActionButton';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import MatchMapsSelect from '@/components/matches/MatchMapsSelect';
import OrganizerCommandCopyButton from '@/components/matches/OrganizerCommandCopyButton';

interface Props {
  match: MatchesJoined;
}

export default async function MatchActions({ match }: Props) {
  const cookieStore = await cookies();
  const { data: maps } = await supabase(cookieStore).getMaps();

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
  async function startMatchSA() {
    'use server';
    return startMatch(match.id);
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
          <div className=" flex gap-2 text-left">
            <ActionButton
              action={startMatchSA}
              successMessage="Match started."
              errorMessage="Failed to start match"
            >
              Start match
            </ActionButton>
            <OrganizerCommandCopyButton match={match} />
            <ActionButton
              action={deleteMatchSA}
              successMessage="Match deleted."
              errorMessage="Failed to delete match"
              kind="btn-error"
            >
              Delete match
            </ActionButton>
          </div>
        )}
        {isOngoing && (
          <ActionButton
            action={finishMatchSA}
            successMessage="Match closed and results created."
            errorMessage="Match set to finished but results not created"
          >
            Finish match
          </ActionButton>
        )}
        {isFinished && (
          <div className="flex gap-4">
            <ActionButton
              action={closeMatchSA}
              successMessage="Match closed without results."
              errorMessage="Failed to close match"
            >
              Close match
            </ActionButton>
            <ActionButton
              action={createResultsSA}
              successMessage="Match closed and results created."
              errorMessage="Failed to create results"
              errorRedirect={`/results/${match.id}`}
            >
              Create results
            </ActionButton>
          </div>
        )}
        {isClosed && (
          <ActionButton
            action={reopenMatchSA}
            successMessage="Match reopened."
            errorMessage="Failed to reopen match"
          >
            Reopen match
          </ActionButton>
        )}
        {maps && !isClosed && <MatchMapsSelect match={match} maps={maps} />}
      </div>
    </div>
  );
}
