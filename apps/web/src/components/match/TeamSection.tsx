import {
  DraftType,
  isTeamsJoined,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
  TeamsJoined,
  TeamsRow,
} from '@bf2-matchmaking/types';
import PlayerItem from '@/components/match/PlayerItem';
import AddPlayerForm from '@/components/match/AddPlayerForm';
import AddTeamPlayerCollapsible from '@/components/AddTeamPlayerCollapsible';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
  team: TeamsRow;
}

export default async function TeamSection({ match, team: teamsRow }: Props) {
  const team = await fetchTeam(match, teamsRow);
  const playerInfo = await fetchPlayerInfo(match);

  const players = match.teams
    .filter(isTeam(team.id))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const emptySlots = Array.from({ length: match.config.size / 2 - players.length });
  return (
    <section>
      <h3 className="text-xl font-bold mb-2">{`Team ${team.name}`}</h3>
      <ul>
        {players.map((mp) => (
          <PlayerItem
            key={mp.player_id}
            match={match}
            playerList={playerInfo}
            mp={mp}
            team={team.id}
          />
        ))}
        {emptySlots.map((e, i) => (
          <li key={i} className="flex items-center mb-1 w-52">
            <AddPlayerForm matchId={match.id} teamId={team.id} />
          </li>
        ))}
      </ul>
      {isTeamsJoined(team) && <AddTeamPlayerCollapsible match={match} team={team} />}
    </section>
  );
}

const isTeam = (team: number) => (mp: MatchPlayersRow) => mp.team === team;

async function fetchTeam(
  match: MatchesJoined,
  team: TeamsRow
): Promise<TeamsRow | TeamsJoined> {
  if (match.config.draft !== DraftType.Team) {
    return team;
  }
  const { data } = await supabase(cookies).getTeam(team.id);
  return data || team;
}

async function fetchPlayerInfo(match: MatchesJoined): Promise<Array<PlayerListItem>> {
  if (match.server && match.status === MatchStatus.Ongoing) {
    const { data } = await api.rcon().getServerPlayerList(match.server.ip);
    if (data) {
      return data;
    }
  }
  return [];
}
