// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from '../../../src/client';
const { host, port, password } = Deno.env.toObject();

console.log('Hello from Functions!');

serve(async (req) => {
  const url = new URL(req.url);

  const client = await createClient({
    host,
    port,
    password,
  });

  const cmd = url.searchParams.get('cmd');

  if (cmd) {
    const data = await client.send(cmd);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response('No command defined', { headers: { 'Content-Type': 'application/json' } });
  }
});

// To invoke:
// curl -i --location --request POST 'https://lprcjdlrakeamyeuydcr.functions.supabase.co/bf2-rcon' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcmNqZGxyYWtlYW15ZXV5ZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njc1Njc2MTgsImV4cCI6MTk4MzE0MzYxOH0.XoHJiXz0hphdhPXy-vzZYo3UnVxdv0bLTXCHogNjUlg' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Espen"}'
