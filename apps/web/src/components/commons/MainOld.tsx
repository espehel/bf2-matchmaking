import { AdminRoleBadgeList } from '@/components/commons/AdminRoleBadgeList';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/commons/Breadcrumbs';
interface Props {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: Array<{ href?: string; label: string }>;
  relevantRoles?: Array<'player_admin' | 'match_admin' | 'server_admin' | 'system_admin'>;
}
export default async function MainOld({
  children,
  title,
  breadcrumbs,
  relevantRoles,
}: Props) {
  return (
    <>
      <div className="flex gap-2 p-4 items-start justify-between">
        {breadcrumbs ? <Breadcrumbs breadcrumbs={breadcrumbs} /> : <div />}
        {relevantRoles && (
          <Suspense fallback={null}>
            <AdminRoleBadgeList relevantRoles={relevantRoles} />
          </Suspense>
        )}
      </div>
      <main className="main mt-0">
        <h1>{title}</h1>
        {children}
      </main>
    </>
  );
}
