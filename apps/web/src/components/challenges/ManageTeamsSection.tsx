import Link from 'next/link';
import React from 'react';
import { TeamsRow } from '@bf2-matchmaking/types';
import { ArrowDownRightIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/16/solid';

interface Props {
  teams: Array<TeamsRow>;
}

export default async function ManageTeamsSection({ teams }: Props) {
  return (
    <section className="section">
      <h2>Your teams</h2>
      {teams.length ? (
        <ul className="menu menu-lg min-w-80 text-accent-content divider-y space-y-1 outline outline-2 outline-accent rounded p-1">
          {teams.map((team) => (
            <li key={team.id} className="bg-accent">
              <Link href={`/challenges/${team.id}`}>
                {team.name}
                <ArrowRightIcon className="size-8 ml-auto" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no teams</p>
      )}
      <Link href="/teams" className="btn btn-secondary w-36">
        Create new team
      </Link>
    </section>
  );
}
