import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  action?: React.ReactNode;
}

export function ErrorState({ message, action }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="break-words">{message}</p>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
