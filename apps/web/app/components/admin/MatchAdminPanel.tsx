import { Form } from '@remix-run/react';
import { FC } from 'react';
import { DraftType, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import AddPlayerForm from '~/components/admin/AddPlayerForm';
import EditPlayerForm from '~/components/admin/EditPlayerForm';

interface Props {
  match: MatchesJoined;
}

const MatchAdminPanel: FC<Props> = ({ match }) => {
  const { status, players, teams, config } = match;
  const playerCount = players.length;
  const hasUnpickedPlayers = teams.some(({ team }) => team === null);

  return (
    <article className="section">
      <p className="font-bold text-red-600 text-xl mb-2">Warning: Highly experimental!</p>
      <h2>Admin panel</h2>
      <section className="flex gap-2 mb-6">
        {status === MatchStatus.Open && (
          <Action action="./summon" name="Start summoning" disabled={playerCount < config.size} />
        )}
        {status === MatchStatus.Ongoing && config.draft === DraftType.Random && (
          <Action action="./start" name="Start match" disabled={playerCount < config.size} />
        )}
        {status === MatchStatus.Open && config.draft === DraftType.Captain && (
          <Action action="./drafting" name="Start drafting" disabled={playerCount < config.size} />
        )}
        {status === MatchStatus.Summoning && config.draft === DraftType.Captain && (
          <Action action="./drafting" name="Start drafting" disabled={playerCount < config.size} />
        )}
        {status === MatchStatus.Drafting && (
          <Action action="./start" name="Start match" disabled={hasUnpickedPlayers} />
        )}
        {status === MatchStatus.Drafting && <Action action="./reopen" name="Reopen match" />}
        {status !== MatchStatus.Closed && <Action action="./close" name="Close match" />}
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
