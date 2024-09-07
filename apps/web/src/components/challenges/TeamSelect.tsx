'use client';
import Select from '@/components/commons/Select';
import { TeamsRow } from '@bf2-matchmaking/types';
import { ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
interface Props {
  teams: Array<TeamsRow>;
}
export default function TeamSelect({ teams }: Props) {
  const router = useRouter();
  const params = useParams<{ team: string }>();
  const selectedTeam = params.team;

  const handleTeamChange = (event: ChangeEvent<HTMLSelectElement>) => {
    router.push(`/challenges/${event.target.value}`);
  };

  return (
    <Select
      options={teams.map(({ id, name }) => [id, name])}
      label="Current team"
      name="current-team"
      onChange={handleTeamChange}
      defaultValue={selectedTeam}
      className="w-full"
    />
  );
}
