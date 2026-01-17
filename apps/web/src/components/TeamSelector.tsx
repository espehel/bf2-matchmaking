'use client';

import { useRouter } from 'next/navigation';
import { setSelectedTeam } from '@/app/actions/team';

interface Team {
  id: number;
  name: string;
}

interface Props {
  teams: Team[];
  selectedTeamId: number | null;
}

export default function TeamSelector({ teams, selectedTeamId }: Props) {
  const router = useRouter();
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = parseInt(e.target.value, 10);
    await setSelectedTeam(teamId);
    router.refresh();
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <select
      className="select select-ghost select-sm font-normal focus:bg-transparent focus:outline-none"
      value={selectedTeamId ?? ''}
      onChange={handleChange}
    >
      {!selectedTeam && (
        <option value="" disabled>
          Select team
        </option>
      )}
      {teams.map((team) => (
        <option key={team.id} value={team.id} className="text-base-content">
          {team.name}
        </option>
      ))}
    </select>
  );
}
