import { isDefined, MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import RevalidateForm from '@/components/RevalidateForm';
import ActionButton from '@/components/ActionButton';
import { api } from '@bf2-matchmaking/utils';
import { generateMatchServers } from '@/app/matches/[match]/server/actions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}
export default async function NoServer({ match, matchServer }: Props) {
  const { data: generatedServers } = await supabase(cookies).getGeneratedServersByMatchId(
    match.id
  );
  const { data: regions } = await api.platform().getRegions();
  const cities = generatedServers
    ?.map((gs) => regions?.find((r) => r.id === gs.region)?.city)
    .filter(isDefined);

  if (!matchServer?.server || !cities?.length) {
    return (
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">No server selected</h2>
      </div>
    );
  }

  const { data: instances } = await api.platform().getServers(match.id);

  const generateMatchServerInstanceSA = async () => {
    'use server';
    return generateMatchServers(match, generatedServers);
  };

  if (instances && instances.length > 0) {
    return (
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">{`Generating server in ${cities.join(', ')}...`}</h2>
        <RevalidateForm path={`/matches/${match.id}`} />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">{`Server will be created in ${cities.join(
          ', '
        )} 15 min before match start.`}</h2>
        <RevalidateForm path={`/matches/${matchServer.id}`} />
      </div>
      <ActionButton
        action={generateMatchServerInstanceSA}
        successMessage="Generating server"
        errorMessage="Failed to generate server"
        kind="btn-primary"
      >
        Generate server now
      </ActionButton>
    </>
  );
}
