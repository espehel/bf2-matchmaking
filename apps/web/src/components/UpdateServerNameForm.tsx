import React from 'react';
import RefreshButton from '@/components/RefreshButton';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { ServerInfo, ServersRow } from '@bf2-matchmaking/types';
import { revalidatePath } from 'next/cache';

interface Props {
  server: ServersRow;
  info: ServerInfo;
}

export default function UpdateServerNameForm({ server, info }: Props) {
  async function update() {
    'use server';
    await supabase(cookies).updateServer(server.ip, {
      name: info.serverName,
    });
    revalidatePath(`/servers/${server.ip}`);
  }

  return (
    <form action={update} className="tooltip" data-tip="Update server name">
      <RefreshButton />
    </form>
  );
}
