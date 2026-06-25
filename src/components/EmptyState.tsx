import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card grid min-h-64 place-items-center text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon size={28} />
        </span>
        <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
