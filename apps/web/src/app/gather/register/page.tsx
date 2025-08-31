import { session } from '@/lib/supabase/supabase-server';
import SignInButton from '@/components/gather/register/SignInButton';
import Main from '@/components/commons/Main';
import ActionForm from '@/components/commons/action/ActionForm';
import InputField from '@/components/form/fields/InputField';
import SubmitActionFormButton from '@/components/commons/action/SubmitActionFormButton';
import { registerKeyhash, registerTeamspeakId } from '@/app/gather/register/action';
import { api } from '@bf2-matchmaking/services/api';
import { verify } from '@bf2-matchmaking/utils';
import ServerplayerSelect from '@/components/gather/register/ServerplayerSelect';

interface Props {
  searchParams: Promise<{ tsid?: string; keyhash?: string }>;
}

export default async function GatherRegisterPage(props: Props) {
  const searchParams = await props.searchParams;
  const player = await session.getSessionPlayerSafe();

  const gather = await api.getGather(20).then(verify);
  const { data } = await api.getServer(gather.state.address);
  const serverPlayers = data?.live?.players;

  if (!player) {
    return (
      <Main title="You must be logged in to register">
        <SignInButton />
      </Main>
    );
  }
  return (
    <Main title="Register for Gather">
      <section className="section mb-4">
        <h2>Register keyhash</h2>
        <ActionForm
          className="flex flex-col gap-2"
          action={registerKeyhash}
          extras={{ playerId: player.id }}
        >
          {serverPlayers && <ServerplayerSelect players={serverPlayers} />}
          <div>
            <InputField
              key={searchParams.keyhash}
              name="keyhash"
              defaultValue={searchParams.keyhash}
            />
            <SubmitActionFormButton className="ml-2" kind="secondary">
              Register
            </SubmitActionFormButton>
          </div>
        </ActionForm>
        {player.keyhash && (
          <div key={player.keyhash} className="alert alert-success w-fit">
            {player.keyhash} registered
          </div>
        )}
      </section>
      <section className="section">
        <h2>Register teamspeak id</h2>
        <ActionForm action={registerTeamspeakId} extras={{ playerId: player.id }}>
          <InputField
            key={searchParams.tsid}
            name="tsid"
            defaultValue={searchParams.tsid}
          />
          <SubmitActionFormButton className="ml-2" kind="secondary">
            Register
          </SubmitActionFormButton>
        </ActionForm>
        {player.teamspeak_id && (
          <div key={player.teamspeak_id} className="alert alert-success w-fit">
            {player.teamspeak_id} registered
          </div>
        )}
      </section>
    </Main>
  );
}
