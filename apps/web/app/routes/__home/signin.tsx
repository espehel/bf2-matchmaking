import { ActionArgs, json, redirect } from '@remix-run/node';
import { remixClient } from '@bf2-matchmaking/supabase';
import { Dialog } from '@headlessui/react';
import { Form, useNavigate } from '@remix-run/react';
import { useUser } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';

const baseRedirect =
  process.env.NODE_ENV === 'production'
    ? 'https://bf2-matchmaking.netlify.app'
    : 'http://localhost:5003';

export const action = async ({ request }: ActionArgs) => {
  const redirectPath = new URL(request.url).searchParams.get('redirectPath');

  const redirectUrl = redirectPath ? baseRedirect.concat(redirectPath) : baseRedirect.concat('/');
  const client = remixClient(request);
  const { data, error: err } = await client.signInUser(redirectUrl);

  if (err) {
    console.error('/signin', err);
    return json(err);
  }

  return redirect(data.url);
};

export default function Signin() {
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  return (
    <Dialog
      open={true}
      onClose={() => {
        navigate('/');
      }}
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-8 text-center">
          <Dialog.Title className="text-4xl font-bold mb-4">Sign in</Dialog.Title>
          <p className="text-xl mb-4">You must sign in with your discord user to join a match</p>
          <Form method="post" action="/signin">
            <button type="submit" className="filled-button">
              Sign in
            </button>
          </Form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
