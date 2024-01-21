import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import { generateMatchServerInstance } from '@/app/matches/[match]/actions';
import RevalidateForm from '@/components/RevalidateForm';
import ActionButton from '@/components/ActionButton';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}
export default async function NoServer({ match, matchServer }: Props) {
  if (!matchServer) {
    return (
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">No server selected</h2>
      </div>
    );
  }

  const { data: regions } = await api.platform().getLocations();
  const city = regions?.find((r) => r.id === matchServer.region)?.city;
  const { data: instances } = await api.platform().getServers(match.id);
  const instance = instances?.find((i) => i.id === matchServer.instance);

  const generateMatchServerInstanceSA = async () => {
    'use server';
    return generateMatchServerInstance(match, matchServer);
  };

  if (instance) {
    return (
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">{`Generating server in ${city}...`}</h2>
        <RevalidateForm path={`/matches/${match.id}`} />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">{`Server will be created${
          ` in ${city}` || ''
        } 15 min before match start.`}</h2>
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
