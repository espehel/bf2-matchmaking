import { configs, events, session } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import AddRoundForm from '@/components/events/AddRoundForm';
import EventRound from '@/components/events/EventRound';
import EditTeamsSection from '@/components/events/EditTeamsSection';
import ActionForm from '@/components/commons/action/ActionForm';
import InputField from '@/components/form/fields/InputField';
import SubmitActionFormButton from '@/components/commons/action/SubmitActionFormButton';
import { updateConfig } from '@/app/admin/configs/actions';

interface Props {
  params: Promise<{ event: string }>;
}

export default async function EventPage(props: Props) {
  const params = await props.params;
  const event = await events.get(Number(params.event)).then(verifySingleResult);
  const config = await configs.get(event.config).then(verifySingleResult);
  const { data: adminRoles } = await session.getAdminRoles();

  if (!adminRoles?.match_admin) {
    throw new Error('Not authorized');
  }

  return (
    <div className="grid grid-cols-6 gap-6 w-full mt-2">
      <section className="section col-span-6">
        <h2>Config</h2>
        <ActionForm
          formAction={updateConfig}
          className="flex gap-2"
          extras={{ id: event.config.toString() }}
        >
          <InputField
            name="channel"
            label="Discord Channel"
            key={config.channel}
            defaultValue={config.channel ?? undefined}
          />
          <InputField
            name="guild"
            label="Discord Server"
            defaultValue={config.guild ?? undefined}
          />
          <SubmitActionFormButton>Update</SubmitActionFormButton>
        </ActionForm>
      </section>
      <section className="section col-span-4 gap-6 grow">
        <h2>Rounds</h2>
        <ul>
          {event.rounds.map((round) => (
            <li key={round.id} className="mb-6">
              <EventRound event={event} round={round} edit={true} />
            </li>
          ))}
        </ul>
        <AddRoundForm eventId={event.id} />
      </section>
      <EditTeamsSection event={event} />
    </div>
  );
}
