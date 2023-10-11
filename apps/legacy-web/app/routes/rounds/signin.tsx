import { useNavigate } from '@remix-run/react';
import { useUser } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import SigninDialog from '~/components/SigninDialog';
export default function Signin() {
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (user) {
      navigate('/rounds');
    }
  }, [user]);

  return (
    <SigninDialog
      onClose={() => {
        navigate('/rounds');
      }}
      text="You must sign in with your discord user to see player scores."
      redirectPath="/rounds"
    />
  );
}
