import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'inline' | 'skeleton';
  lines?: number;
}

export function LoadingState({ message = 'Loading…', variant = 'inline', lines = 3 }: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-2" role="status" aria-live="polite" aria-label={message}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-3 rounded-md"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span>{message}</span>
    </div>
  );
}
