import { ReactNode } from 'react';

interface Props {
  ok: boolean;
  title: ReactNode;
  children: ReactNode;
}

export default function StatusCollapse({ ok, title, children }: Props) {
  return (
    <div
      className={`collapse collapse-plus bg-base-300 text-base-content border ${
        ok ? 'border-success' : 'border-error'
      }`}
    >
      <input type="checkbox" />
      <div
        className={`collapse-title text-xl font-medium ${
          ok ? 'bg-success text-success-content' : 'bg-error text-error-content'
        }`}
      >
        {title}
      </div>
      <div className="collapse-content">{children}</div>
    </div>
  );
}
