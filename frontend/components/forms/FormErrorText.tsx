import { cn } from '@/lib/utils';

interface FormErrorTextProps {
  message?: string | null;
  className?: string;
}

export function FormErrorText({ message, className }: FormErrorTextProps) {
  if (!message) return null;
  return <p className={cn('text-xs text-destructive', className)}>{message}</p>;
}
