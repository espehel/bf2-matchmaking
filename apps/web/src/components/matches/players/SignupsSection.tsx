import { MatchesJoined } from '@bf2-matchmaking/types';
import { MatchPlayerItem } from '@/components/matches/players/MatchPlayerItem';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { assertObj } from '@bf2-matchmaking/utils';
import ActionButton from '@/components/commons/action/ActionButton';
import { resetMatchPlayersRating } from '@/app/matches/[match]/players/actions';

interface Props {
  match: MatchesJoined;
}

export default function SignupsSection({ match }: Props) {
  const playerTuples = match.players
    .map((player) => {
      const mp = match.teams.find(({ player_id }) => player_id === player.id);
      assertObj(
        mp,
        `Match player not found for player ${player.id} in match ${match.id}`
      );
      return [player, mp] as const;
    })
    .sort(([a], [b]) => a.nick.localeCompare(b.nick));

  return (
    <section className="section col-span-2 xl:col-span-1">
      <h2>Sign ups</h2>
      <ul className="list bg-base-200 rounded-md shadow-md shadow-base-300 w-full">
        {playerTuples.map(([player, matchPlayer]) => (
          <MatchPlayerItem
            player={player}
            matchPlayer={matchPlayer}
            key={`${player.id}${matchPlayer.team}${matchPlayer.role}`}
            teams={[match.home_team, match.away_team]}
          />
        ))}
      </ul>
      <div className="flex gap-2">
        <Link
          className="btn btn-accent"
          href={`/admin/configs/${match.config.id}/ratings?match=${match.id}`}
          target="_blank"
        >
          Manage ratings
          <ArrowTopRightOnSquareIcon className="size-4" />
        </Link>
        <ActionButton
          color="secondary"
          action={resetMatchPlayersRating}
          input={{ matchId: match.id }}
        >
          Reset ratings
        </ActionButton>
      </div>
    </section>
  );
}
