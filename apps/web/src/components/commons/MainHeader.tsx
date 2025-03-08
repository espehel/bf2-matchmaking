'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/16/solid';

interface Props {
  topPath: string;
  children: string;
}

export default function MainHeader({ topPath, children }: Props) {
  const pathname = usePathname();
  if (pathname !== topPath)
    return (
      <Link className="flex items-center" href={topPath}>
        <ChevronLeftIcon className="size-6" />
        <p>{children}</p>
      </Link>
    );
  return <div />;
}
