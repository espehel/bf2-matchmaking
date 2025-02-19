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
  disabled?: boolean;
}

export default async function LiveServerSelectAction({
  action,
  defaultServer,
  disabled,
}: Props) {
  const { data: servers } = await api.v2.getServers();
  if (!servers) {
    return null;
  }

  async function serverAction(data: FormData) {
    'use server';
    return action(data);
  }

  return (
    <ActionForm
      action={serverAction}
      successMessage="Gather server selected"
      errorMessage="Failed to select Gather server"
      className="flex items-end gap-2"
    >
      <Select
        label="Server"
        name="serverSelect"
        placeholder="No server set"
        defaultValue={defaultServer}
        options={servers.map((server) => [server.address, getServerName(server)])}
        disabled={disabled}
      />
      <SubmitActionFormButton disabled={disabled}>
        <ArrowRightCircleIcon className="size-8" />
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
