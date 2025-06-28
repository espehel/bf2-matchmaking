import { ActiveTeam, PlayersRow, TeamsRow } from '@bf2-matchmaking/types';
import Select from '@/components/commons/Select';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';

interface Props {
  onTeamSelected?: (team: TeamsRow | null) => void;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  defaultValue?: string | number;
  name?: string;
  label: string;
  filter?: 'member' | 'captain' | 'owner';
}

export async function TeamsSelect({
  placeholder = 'Name',
  disabled = false,
  defaultValue,
  name = 'team',
  label,
  filter,
  size,
}: Props) {
  const cookieStore = await cookies();
  const { data: teams } = await supabase(cookieStore).getActiveTeams();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();

  const options =
    filterTeams(player, teams || [], filter).map<[number, string]>((team) => [
      team.id,
      team.name,
    ]) || [];

  return (
    <Select
      options={options}
      label={label}
      name={name}
      placeholder={options.length === 0 ? 'No available team' : placeholder}
      disabled={disabled}
      defaultValue={defaultValue}
      size={size}
    />
  );
}

function filterTeams(
  player: PlayersRow | null,
  teams: ActiveTeam[],
  filter: 'member' | 'captain' | 'owner' | undefined
) {
  if (!filter) {
    return teams;
  }
  if (!player) {
    return [];
  }
  switch (filter) {
    case 'member':
      return teams.filter((team) => team.players.some((p) => p.player_id === player.id));
    case 'captain':
      return teams.filter(
        (team) =>
          team.owner.id === player.id ||
          team.players.some((p) => p.player_id === player.id && p.captain)
      );
    case 'owner':
      return teams.filter((team) => team.owner.id === player.id);
  }
}
