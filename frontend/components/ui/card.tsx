import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glass' | 'solid' | 'outline';

const cardVariants: Record<CardVariant, string> = {
  default:
    'border-border/60 bg-gradient-card backdrop-blur-md shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.15)] hover:border-primary/40 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5',
  glass:
    'glass hover:border-primary/45 hover:shadow-[0_18px_40px_-16px_hsl(var(--primary)/0.45)] hover:-translate-y-0.5',
  solid: 'border-border/60 bg-card shadow-sm',
  outline: 'border-border/70 bg-transparent hover:border-primary/40',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'group/card relative rounded-xl border text-card-foreground transition-all duration-300 ease-out',
        cardVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}