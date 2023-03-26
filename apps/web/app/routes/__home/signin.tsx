import { ActionArgs, json, redirect } from '@remix-run/node';
import { remixClient } from '@bf2-matchmaking/supabase';
import { useNavigate } from '@remix-run/react';
import { useUser } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import SigninDialog from '~/components/SigninDialog';

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
    <SigninDialog
      onClose={() => {
        navigate('/');
      }}
      text="You must sign in with your discord user to join a match"
      redirectPath="/"
    />
  );
}
