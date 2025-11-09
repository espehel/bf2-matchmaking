'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import classNames from 'classnames';
interface Props {
  event: string;
  isAdmin: boolean;
}
export default function EventNav({ event, isAdmin }: Props) {
  return (
    <div role="tablist" className="tabs tabs-box tabs-lg w-fit">
      <TabLink label="Schedule" path={`/events/${event}`} />
      <TabLink label="Standings" path={`/events/${event}/standings`} />
      {isAdmin && <TabLink label="Manage" path={`/events/${event}/manage`} />}
    </div>
  );
}

function TabLink({ path, label }: { path: string; label: string }) {
  const pathname = usePathname();

  const classes = classNames('tab p-4 pt-3 inline-flex items-center', {
    'tab-active': path === pathname,
  });
  return (
    <Link role="tab" className={classes} href={path}>
      {label}
    </Link>
  );
}
