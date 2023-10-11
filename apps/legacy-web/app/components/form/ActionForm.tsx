import { FC, PropsWithChildren } from 'react';
import { Form } from '@remix-run/react';

interface Props {
  action: string;
  disabled?: boolean;
  className?: string;

  actionLabel: string;
}
const ActionForm: FC<PropsWithChildren<Props>> = ({
  action,
  disabled,
  className,
  children,
  actionLabel,
}) => (
  <Form method="post" action={action} className={className} reloadDocument>
    {children}
    <button className="filled-button w-fit" type="submit" disabled={disabled}>
      {actionLabel}
    </button>
  </Form>
);

export default ActionForm;
