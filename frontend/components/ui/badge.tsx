import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/15 text-primary',
        secondary: 'border-border/60 bg-secondary/70 text-secondary-foreground',
        outline: 'border-border/70 text-foreground',
        solid: 'border-transparent bg-primary text-primary-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-400 dark:text-emerald-300',
        warning: 'border-amber-500/30 bg-amber-500/12 text-amber-400 dark:text-amber-300',
        info: 'border-sky-500/30 bg-sky-500/12 text-sky-400 dark:text-sky-300',
        destructive: 'border-destructive/40 bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}