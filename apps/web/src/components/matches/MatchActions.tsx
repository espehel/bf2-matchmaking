import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import {
  closeMatch,
  deleteMatch,
  finishMatch,
  reopenMatch,
  createResults,
  startMatch,
} from '@/app/matches/[match]/actions';
import ActionForm from '@/components/commons/action/ActionForm';
import SelectField from '@/components/form/fields/SelectField';
import { matches, session } from '@/lib/supabase/supabase-server';
import SubmitActionFormButton from '@/components/commons/action/SubmitActionFormButton';
import ActionButton from '@/components/commons/action/ActionButton';
import ActionButtonOld from '@/components/ActionButton';

interface Props {
  match: MatchesJoined;
}

export default async function MatchActions({ match }: Props) {
  const { data: adminRoles } = await session.getAdminRoles();

  const isScheduled = match.status === MatchStatus.Scheduled;
  const isOngoing = match.status === MatchStatus.Ongoing;
  const isFinished = match.status === MatchStatus.Finished;
  const isClosed = match.status === MatchStatus.Closed;
  const isDeleted = match.status === MatchStatus.Deleted;

  const isMatchAdmin = adminRoles?.match_admin || adminRoles?.system_admin || false;

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
    <div className="flex flex-wrap gap-2">
      {isScheduled && <StartMatchForm match={match} />}
      {isScheduled ||
        (isMatchAdmin && !isDeleted && (
          <ActionButton action={deleteMatch} input={{ matchId: match.id }} color="error">
            Delete match
          </ActionButton>
        ))}
      {isOngoing && (
        <ActionButtonOld
          formAction={finishMatchSA}
          successMessage="Match closed and results created."
          errorMessage="Match set to finished but results not created"
        >
          Finish match
        </ActionButtonOld>
      )}
      {isFinished && (
        <>
          <ActionButtonOld
            formAction={closeMatchSA}
            successMessage="Match closed without results."
            errorMessage="Failed to close match"
          >
            Close match
          </ActionButtonOld>
          <ActionButtonOld
            formAction={createResultsSA}
            successMessage="Match closed and results created."
            errorMessage="Failed to create results"
            errorRedirect={`/results/${match.id}`}
          >
            Create results
          </ActionButtonOld>
        </>
      )}
      {isClosed && (
        <ActionButtonOld
          formAction={reopenMatchSA}
          successMessage="Match reopened."
          errorMessage="Failed to reopen match"
        >
          Reopen match
        </ActionButtonOld>
      )}
    </div>
  );
}

async function StartMatchForm({ match }: Props) {
  const { data: matchServers } = await matches.servers.get(match.id);
  const options: Array<[string, string]> =
    matchServers?.servers.map((server) => [server.ip, server.name]) || [];
  const defaultValue = options.at(0)?.at(0);
  return (
    <ActionForm formAction={startMatch} extras={{ matchId: match.id.toString() }}>
      <div className="join">
        <SelectField
          key={options.join()}
          kind="primary"
          options={options}
          defaultValue={defaultValue}
          name="server"
          label="Server"
          className="join-item"
          placeholder="Missing server"
        />
        <SubmitActionFormButton
          className="join-item btn-primary"
          disabled={!defaultValue}
        >
          Start match
        </SubmitActionFormButton>
      </div>
    </ActionForm>
  );
}
