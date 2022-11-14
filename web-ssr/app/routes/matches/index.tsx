import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node'; // change this import to whatever runtime you are using
import invariant from 'tiny-invariant';
import { createServerClient } from '@supabase/auth-helpers-remix';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { createMatch, initSupabase } from '~/lib/supabase.server';
import { isOpen, isStarted } from '~/utils/match-utils';

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const size = formData.get('size');
  invariant(size, 'No size included');
  initSupabase(request);
  const result = await createMatch(size.toString());
  invariant(result.data, 'Failed to create match');
  return redirect(`/matches/${result.data.id}`);
};

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  invariant(process.env.SUPABASE_URL, 'Missing "process.env.SUPABASE_URL"');
  invariant(process.env.SUPABASE_ANON_KEY, 'Missing "process.env.SUPABASE_ANON_KEY"');

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { request, response }
  );

  const { data: matches } = await supabaseClient.from('matches').select('*');

  return json({ matches });
};

export default function Index() {
  const { matches } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1 className="text-2xl">Matches</h1>
      <section className="border p-4 rounded mb-4">
        <h2 className="text-xl">Create new match</h2>
        <Form className="flex flex-col" method="post" reloadDocument>
          <label>
            Size:
            <input className="text-field my-2" name="size" />
          </label>
          <button type="submit" className="filled-button max-w-sm">
            Create
          </button>
        </Form>
      </section>
      <section>
        <h2 className="text-2xl">Open matches:</h2>
        <ul className="flex flex-col">
          {matches?.filter(isOpen).map((match) => (
            <li key={match.id}>
              <Link
                className="block border p-2 rounded mb-2"
                to={`/matches/${match.id}`}
              >{`${match.id} - ${match.status} - ${match.created_at}`}</Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-2xl">Previous matches:</h2>
        <ul className="flex flex-col">
          {matches?.filter(isStarted).map((match) => (
            <li key={match.id}>
              <Link
                className="block border p-2 rounded mb-2"
                to={`/matches/${match.id}`}
              >{`${match.id} - ${match.status} - ${match.created_at}`}</Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
