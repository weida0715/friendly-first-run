import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input/80 bg-background/60 px-3 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] backdrop-blur-sm ring-offset-background transition-all duration-200',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70',
        'hover:border-border focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
        'aria-[invalid=true]:border-destructive/70 aria-[invalid=true]:ring-destructive/30 aria-[invalid=true]:focus-visible:ring-destructive/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
