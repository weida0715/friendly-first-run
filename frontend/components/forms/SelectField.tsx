import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: Array<{ value: string; label: string }>;
  onValueChange?: (value: string) => void;
}

export function SelectField({ options, onValueChange, className, ...props }: SelectFieldProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'flex h-10 w-full appearance-none rounded-md border border-input/80 bg-background/60 px-3 pr-9 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] backdrop-blur-sm transition-colors hover:border-border focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
