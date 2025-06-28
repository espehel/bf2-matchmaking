import Link from 'next/link';

interface Props {
  breadcrumbs: Array<{ href?: string; label: string }>;
}

export default function Breadcrumbs({ breadcrumbs }: Props) {
  return (
    <nav className="breadcrumbs text-sm">
      <ul>
        {breadcrumbs.map(({ href, label }) => (
          <li key={href || 'current'}>
            {href ? <Link href={href}>{label}</Link> : label}
          </li>
        ))}
      </ul>
    </nav>
  );
}
