import { Form } from '@remix-run/react';
import { FC } from 'react';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import PlayerSelect from '~/components/admin/PlayerSelect';
import AddPlayerForm from '~/components/admin/AddPlayerForm';
import EditPlayerForm from '~/components/admin/EditPlayerForm';

interface Props {
  match: MatchesJoined;
}

const MatchAdminPanel: FC<Props> = ({ match }) => {
  const playerCount = match.players.length;
  const hasUnpickedPlayers = match.teams.some(({ team }) => team === null);

  return (
    <article className="section">
      <p className="font-bold text-red-600 text-xl mb-2">Warning: Highly experimental!</p>
      <h2>Admin panel</h2>
      <section className="flex gap-2 mb-6">
        {match.status === MatchStatus.Open && (
          <Action action="./summon" name="Start summoning" disabled={playerCount < match.size} />
        )}
        {match.status === MatchStatus.Open && match.pick === 'random' && (
          <Action action="./start" name="Start match" disabled={playerCount < match.size} />
        )}
        {match.status === MatchStatus.Open && match.pick === 'captain' && (
          <Action action="./drafting" name="Start drafting" disabled={playerCount < match.size} />
        )}
        {match.status === MatchStatus.Summoning && match.pick === 'captain' && (
          <Action action="./drafting" name="Start drafting" disabled={playerCount < match.size} />
        )}
        {match.status === MatchStatus.Drafting && (
          <Action action="./start" name="Start match" disabled={hasUnpickedPlayers} />
        )}
        {match.status === MatchStatus.Drafting && <Action action="./reopen" name="Reopen match" />}
        {match.status !== MatchStatus.Closed && <Action action="./close" name="Close match" />}
      </section>
      <section>
        <h3>Players:</h3>
        <AddPlayerForm match={match} />
        <EditPlayerForm match={match} />
      </section>
    </article>
  );
};

interface ActionProps {
  action: string;
  name: string;
  disabled?: boolean;
}
const Action: FC<ActionProps> = ({ action, name, disabled }) => (
  <Form method="post" action={action}>
    <button type="submit" className="filled-button" disabled={disabled}>
      {name}
    </button>
  </Form>
);

export default MatchAdminPanel;
