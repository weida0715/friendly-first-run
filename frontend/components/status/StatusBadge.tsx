import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'active' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' | 'info';

export type StatusVariantMap = Record<string, StatusTone>;

const toneStyles: Record<StatusTone, { className: string; dot: string; pulse?: boolean }> = {
  active:      { className: 'border-sky-500/35 bg-sky-500/12 text-sky-400 dark:text-sky-300', dot: 'bg-sky-400', pulse: true },
  success:     { className: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400 dark:text-emerald-300', dot: 'bg-emerald-400' },
  warning:     { className: 'border-amber-500/35 bg-amber-500/12 text-amber-400 dark:text-amber-300', dot: 'bg-amber-400' },
  destructive: { className: 'border-destructive/45 bg-destructive/12 text-destructive', dot: 'bg-destructive' },
  info:        { className: 'border-sky-500/35 bg-sky-500/12 text-sky-400 dark:text-sky-300', dot: 'bg-sky-400' },
  outline:     { className: '', dot: 'bg-muted-foreground/60' },
  secondary:   { className: '', dot: 'bg-muted-foreground/60' },
};

export const defaultStatusVariantMap: StatusVariantMap = {
  active: 'active',
  enabled: 'success',
  success: 'success',
  approved: 'success',
  running: 'active',
  queued: 'info',
  pending: 'warning',
  warning: 'warning',
  disabled: 'destructive',
  rejected: 'destructive',
  error: 'destructive',
  failed: 'destructive',
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  map?: StatusVariantMap;
}

export function StatusBadge({ status, label, map = defaultStatusVariantMap }: StatusBadgeProps) {
  const normalized = normalize(status);
  const tone = map[normalized] ?? 'outline';
  const text = label ?? status;
  const style = toneStyles[tone];

  if (tone === 'outline') return <Badge variant="outline"><Dot className={style.dot} /> {text}</Badge>;
  if (tone === 'secondary') return <Badge variant="secondary"><Dot className={style.dot} /> {text}</Badge>;
  return (
    <Badge className={style.className}>
      <Dot className={style.dot} pulse={style.pulse} />
      {text}
    </Badge>
  );
}

function Dot({ className, pulse }: { className: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      {pulse ? <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', className)} /> : null}
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', className)} />
    </span>
  );
}
