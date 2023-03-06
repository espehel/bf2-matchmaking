import { FC, PropsWithChildren } from 'react';
import { Form, useFetcher } from '@remix-run/react';

interface Props {
  action: string;
  disabled?: boolean;
  className?: string;
  isNavigation?: boolean;
}
const ActionButton: FC<PropsWithChildren<Props>> = ({
  action,
  disabled,
  className,
  children,
  isNavigation = false,
}) => {
  const { Form: FetcherForm } = useFetcher();

  if (isNavigation) {
    return (
      <Form method="post" action={action} reloadDocument>
        <button type="submit" className={className || 'filled-button'} disabled={disabled}>
          {children}
        </button>
      </Form>
    );
  }

  return (
    <FetcherForm method="post" action={action}>
      <button type="submit" className={className || 'filled-button'} disabled={disabled}>
        {children}
      </button>
    </FetcherForm>
  );
};

export default ActionButton;
