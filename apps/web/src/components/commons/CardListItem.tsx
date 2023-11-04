import { PropsWithChildren } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
interface Props extends PropsWithChildren {
  href?: string;
}

export default function CardListItem({ children, href }: Props) {
  const cardClasses = classNames(
    'px-8 py-4 border-2 border-primary rounded bg-base-100',
    {
      'mb-4': !href,
    }
  );

  if (href) {
    return (
      <li className="mb-4">
        <Link href={href}>{<div className={cardClasses}>{children}</div>}</Link>
      </li>
    );
  }

  return <li className={cardClasses}>{children}</li>;
}
