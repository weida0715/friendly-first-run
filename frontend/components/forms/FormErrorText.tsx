import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorTextProps {
  message?: string | null;
  className?: string;
}

export function FormErrorText({ message, className }: FormErrorTextProps) {
  if (!message) return null;
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-destructive', className)} role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
