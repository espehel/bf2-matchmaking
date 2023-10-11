import React, { FC } from 'react';
import { Dialog } from '@headlessui/react';
import { Form } from '@remix-run/react';

interface Props {
  onClose: VoidFunction;
  text: string;
  redirectPath: string;
}

const SigninDialog: FC<Props> = ({ onClose, text, redirectPath }) => {
  return (
    <Dialog open={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-8 text-center">
          <Dialog.Title className="text-4xl font-bold mb-4">Sign in</Dialog.Title>
          <p className="text-xl mb-4">{text}</p>
          <Form method="post" action={`/signin?redirectPath=${redirectPath}`}>
            <button type="submit" className="filled-button">
              Sign in
            </button>
          </Form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SigninDialog;
