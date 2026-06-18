import { Inbox } from 'lucide-react';

interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
}

export function TableEmptyRow({ colSpan, message = 'No records available.' }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
            <Inbox className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}
