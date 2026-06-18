import { cn } from '@/lib/utils';

interface TableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function TableToolbar({ children, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        'glass grid grid-cols-1 gap-3 rounded-xl p-3 md:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
