import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { ChallengeTeamssRow } from '@bf2-matchmaking/types';
import Link from 'next/link';
import React from 'react';

const CONFIG_5v5 = 22;

export default async function LeaderboardSection() {
  const entries = await supabase(cookies)
    .getChallengeTeamsByConfig(CONFIG_5v5)
    .then(verifyResult);

  const sortedEntries = [...entries.sort(compareTeams)];

  return (
    <section className="section min-w-96">
      <h2>Leaderboard 5v5</h2>
      <table className="table table-zebra">
        <thead>
          <tr>
            <th></th>
            <th>Team</th>
            <th>Matches</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry, i) => (
            <tr key={entry.team_id}>
              <td>{i + 1}</td>
              <td>{entry.team?.name}</td>
              <td>{entry.match_count}</td>
              <td>{entry.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/results/leagues/22" className="btn btn-secondary w-36">
        See results
      </Link>
    </section>
  );
}

function compareTeams(a: ChallengeTeamssRow, b: ChallengeTeamssRow) {
  if (a.rating !== b.rating) {
    return b.rating - a.rating;
  }
  if (a.match_count === b.match_count) {
    return a.team_id - b.team_id;
  }
  if (a.match_count === 0) {
    return 1;
  }
  if (b.match_count === 0) {
    return -1;
  }
  return a.match_count - b.match_count;
}
