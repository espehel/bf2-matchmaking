import { GatherPlayer } from '@bf2-matchmaking/types';

interface Props {
  players: Array<GatherPlayer>;
}

export default function PlayersSection({ players }: Props) {
  return (
    <section className="section flex-auto">
      <h2>Queueing Players</h2>
      {players.length === 0 ? (
        <p>Empty queue</p>
      ) : (
        <ol className="prose">
          {players.map((player) => (
            <li key={player.teamspeak_id}>{player.nick}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
