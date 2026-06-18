import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[var(--glow-primary)]',
        hero: 'bg-gradient-accent text-primary-foreground shadow-[var(--glow-primary)] hover:shadow-[var(--glow-accent)] animate-gradient-x',
        outline: 'border border-border/70 bg-background/40 backdrop-blur-sm hover:bg-accent/15 hover:text-foreground hover:border-primary/40',
        ghost: 'hover:bg-accent/15 hover:text-foreground',
        'ghost-glow': 'text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.5)]',
        glass: 'glass text-foreground hover:border-primary/50 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.45)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_18px_-4px_hsl(var(--destructive)/0.6)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
        xs: 'h-7 rounded px-2 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Spinner = () => (
  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading && !asChild ? <Spinner /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };