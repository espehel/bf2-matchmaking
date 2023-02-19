import { Form, useLocation } from '@remix-run/react';
import { FC } from 'react';

const SigninSection: FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="section flex flex-col gap-2 h-min w-1/3">
      <h2>Sign in</h2>
      <p className="text-xl mb-4">
        You must sign in with your discord user to see and join a match
      </p>
      <Form method="post" action={`/signin?redirectPath=${pathname}`}>
        <button type="submit" className="filled-button">
          Sign in
        </button>
      </Form>
    </div>
  );
};

export default SigninSection;
