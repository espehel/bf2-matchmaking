import ActionForm from '@/components/form/ActionForm';
import TextField from '@/components/commons/TextField';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import FormSubmitButton from '@/components/FormSubmitButton';
import React from 'react';
import { registerTeamspeakId } from '@/app/players/teamspeak/actions';
import { PlayersRow } from '@bf2-matchmaking/types';

interface Props {
  searchParams: { tsid?: string };
}

export default async function Page({ searchParams }: Props) {
  const { data: sessionPlayer } = await supabase(cookies).getSessionPlayer();
  const teamspeakPlayer = await getPlayerByTeamspeakId(searchParams.tsid);
  return (
    <main className="main">
      <h1>Register Teamspeak Id</h1>
      <section className="section max-w-2xl">
        <ActionForm
          action={registerTeamspeakId}
          successMessage="Successfully registerd teamspeak id"
          errorMessage="Failed to register teamspeak id"
          className="form-control gap-4"
        >
          <TextField name="tsid" label="Teamspeak Id" defaultValue={searchParams.tsid} />
          <TextField
            name="player_id"
            label="Discord Id"
            defaultValue={sessionPlayer?.id}
            tooltip="Get discord id by signing in with Discord, or copy user id from Discord client."
          />
          {teamspeakPlayer && (
            <div
              role="alert"
              className="alert alert-error"
            >{`Teamspeak Id already registered to ${teamspeakPlayer.nick}`}</div>
          )}
          {sessionPlayer?.teamspeak_id && (
            <div
              role="alert"
              className="alert alert-info"
            >{`You're already registered with Teamspeak Id ${sessionPlayer.teamspeak_id}`}</div>
          )}

          <FormSubmitButton disabled={Boolean(teamspeakPlayer)}>
            Register teamspeak id
          </FormSubmitButton>
        </ActionForm>
      </section>
    </main>
  );
}

async function getPlayerByTeamspeakId(tsid?: string): Promise<PlayersRow | null> {
  if (!tsid) {
    return null;
  }
  const { data } = await supabase(cookies).getPlayerByTeamspeakId(tsid);
  return data;
}
