import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/16/solid';
import SummoningSection from '@/components/matches/SummoningSection';
import TeamSection from '@/components/matches/team/TeamSection';
import React from 'react';

interface Props {
  match: MatchesJoined;
}

export function MatchRoster({ match }: Props) {
  const isOpen =
    match.status === MatchStatus.Open || match.status === MatchStatus.Scheduled;

  if (match.config.type === 'Mix' && isOpen) {
    return (
      <div className="text-left">
        <ul className="list bg-base-200 rounded-md shadow-md shadow-base-300 w-sm">
          {match.players.map((player) => (
            <li className="list-row" key={player.id}>
              {player.nick}
            </li>
          ))}
        </ul>
        <Link href={`/matches/${match.id}/players`} className="btn btn-secondary mt-2">
          Manage players
          <ArrowRightIcon className="size-6" />
        </Link>
      </div>
    );
  }

  if (match.status === MatchStatus.Summoning) {
    return <SummoningSection match={match} />;
  }

  return (
    <div className="border-primary border-1 p-4 rounded bg-base-300 flex-1">
      <div className="flex justify-start gap-8">
        <TeamSection match={match} team={match.home_team} />
        <div className="divider divider-horizontal">vs</div>
        <TeamSection match={match} team={match.away_team} />
      </div>
    </div>
  );
}
