import ActionButton from '@/components/commons/action/ActionButton';
import { setMatchPlayerTeams } from '@/app/matches/[match]/players/actions';
import { MatchesJoined } from '@bf2-matchmaking/types';
import TeamList from '@/components/matches/players/TeamList';

interface Props {
  match: MatchesJoined;
}

export default function TeamsSection({ match }: Props) {
  return (
    <section className="section col-span-2 xl:col-span-1">
      <h2>Teams</h2>
      <fieldset className="fieldset flex bg-base-200 border-base-300 rounded-box border p-4">
        <legend className="fieldset-legend">Mix teams</legend>
        <ActionButton
          className="btn btn-secondary btn-lg"
          action={setMatchPlayerTeams}
          input={{ matchId: match.id, method: 'random' }}
        >
          Random
        </ActionButton>
        <ActionButton
          className="btn btn-secondary btn-lg"
          action={setMatchPlayerTeams}
          input={{ matchId: match.id, method: 'rating' }}
        >
          Rating
        </ActionButton>
        <ActionButton
          className="btn btn-secondary btn-lg"
          action={setMatchPlayerTeams}
          input={{ matchId: match.id, method: 'roles' }}
        >
          Rating and roles
        </ActionButton>
      </fieldset>
      <div className="flex gap-6">
        <TeamList match={match} team={match.home_team} />
        <div className="divider divider-horizontal">vs</div>
        <TeamList match={match} team={match.away_team} />
      </div>
    </section>
  );
}
