import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'No data available for this section.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        {icon ?? <Sparkles className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <p className="font-semibold tracking-tight">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
