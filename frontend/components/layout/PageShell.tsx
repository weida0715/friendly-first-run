import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn('container max-w-7xl space-y-8 py-2 sm:py-4', className)}>
      {children}
    </main>
  );
}
