import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumbs, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-3 min-w-0', className)}>
      {breadcrumbs ? <div>{breadcrumbs}</div> : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:flex md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              <span className="h-1 w-1 rounded-full bg-primary" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">{title}</span>
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
