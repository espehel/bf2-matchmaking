'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import classNames from 'classnames';
import {
  PlusCircleIcon,
  CalendarIcon,
  PlayIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

interface Props {
  scheduledCount: number;
  ongoingCount: number;
}

export default function MatchesSidebar({
  scheduledCount,
  ongoingCount,
}: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: '/matches', label: 'Create Match', exact: true, icon: PlusCircleIcon },
    { href: '/matches/scheduled', label: 'Scheduled', count: scheduledCount, icon: CalendarIcon },
    { href: '/matches/ongoing', label: 'Ongoing', count: ongoingCount, icon: PlayIcon },
    { href: '/matches/results', label: 'Results', icon: TrophyIcon },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 shrink-0 animate-slide-up h-full min-h-[calc(100vh-8rem)]">
      <div className="sticky top-4">
        <nav className="card bg-base-200 border border-base-300 shadow-sm transition-smooth hover:shadow-md">
          <ul className="menu menu-lg gap-1 p-3">
            {navItems.map(({ href, label, count, exact, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={classNames(
                    'transition-all duration-200 ease-out flex items-center gap-3 text-base font-medium',
                    {
                      active: isActive(href, exact),
                      'hover:translate-x-1': !isActive(href, exact),
                    }
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {count !== undefined && (
                    <span className="badge badge-sm badge-primary ml-auto transition-transform duration-200 hover:scale-110">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
