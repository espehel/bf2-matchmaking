import Select from '@/components/commons/Select';
import React from 'react';
import ActionForm from '@/components/form/ActionForm';
import SubmitActionFormButton from '@/components/form/SubmitActionFormButton';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { api } from '@bf2-matchmaking/utils';
import { LiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  action: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null } | undefined>;
  defaultServer?: string;
}

export default async function LiveServerSelectAction({ action, defaultServer }: Props) {
  const { data: servers } = await api.v2.getServers();
  if (!servers) {
    return null;
  }
  return (
    <ActionForm
      action={action}
      successMessage="Gather server selected"
      errorMessage="Failed to select Gather server"
    >
      <Select
        label="Server"
        name="serverSelect"
        placeholder="No server set"
        defaultValue={defaultServer}
        options={servers.map((server) => [server.address, getServerName(server)])}
      />
      <SubmitActionFormButton>
        <ArrowRightCircleIcon className="size-6" />
      </SubmitActionFormButton>
    </ActionForm>
  );
}

function getServerName(server: LiveServer) {
  if (server.data) {
    const { city, country } = server.data;
    return `${server.name}, ${city}, ${country} (${server.status})`;
  }
  return `${server.name} (${server.status})`;
}
