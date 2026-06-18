import { cn } from '@/lib/utils';

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}

export function DataTable({ children, className, dense = false }: DataTableProps) {
  return (
    <div
      className={cn(
        'relative overflow-x-auto rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-[0_4px_24px_-12px_hsl(var(--primary)/0.18)]',
        className,
      )}
    >
      <table
        className={cn(
          'w-full text-sm border-separate border-spacing-0',
          '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10',
          '[&_thead_tr]:bg-background/70 [&_thead_tr]:backdrop-blur-md',
          '[&_thead_th]:border-b [&_thead_th]:border-border/60 [&_thead_th]:px-3 [&_thead_th]:text-left [&_thead_th]:text-[11px] [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wider [&_thead_th]:text-muted-foreground',
          dense ? '[&_thead_th]:py-2 [&_tbody_td]:py-1.5' : '[&_thead_th]:py-3 [&_tbody_td]:py-3',
          '[&_tbody_td]:px-3 [&_tbody_td]:border-b [&_tbody_td]:border-border/40 [&_tbody_td]:align-middle',
          '[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-primary/[0.04]',
          '[&_tbody_tr:nth-child(even)]:bg-muted/20',
          '[&_tbody_tr:last-child_td]:border-b-0',
        )}
      >
        {children}
      </table>
    </div>
  );
}
