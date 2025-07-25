import TeamSelect from '@/components/challenges/TeamSelect';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import AddChallengeTeamForm from '@/components/challenges/AddChallengeTeamForm';
interface Props {
  player: PlayersRow;
  selectedTeam: TeamsJoined;
}
export default async function ChallengesMenu({ player, selectedTeam }: Props) {
  const cookieStore = await cookies();
  const { data: playerTeams } = await supabase(cookieStore).getTeamsByPlayerId(player.id);

  return (
    <div className="flex flex-col divide-y divide-primary gap-8">
      <TeamSelect teams={playerTeams || []} />
      <AddChallengeTeamForm selectedTeam={selectedTeam} />
    </div>
  );
}
