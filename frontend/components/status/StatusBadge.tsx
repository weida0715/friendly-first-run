import { Badge } from '@/components/ui/badge';

export type StatusTone = 'active' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary';

export type StatusVariantMap = Record<string, StatusTone>;

const toneClassMap: Record<StatusTone, string> = {
  active: 'bg-sky-600 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-black',
  destructive: 'bg-red-600 text-white',
  outline: '',
  secondary: '',
};

export const defaultStatusVariantMap: StatusVariantMap = {
  active: 'active',
  enabled: 'success',
  success: 'success',
  approved: 'success',
  pending: 'warning',
  warning: 'warning',
  disabled: 'destructive',
  rejected: 'destructive',
  error: 'destructive',
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

  if (tone === 'outline') return <Badge variant="outline">{text}</Badge>;
  if (tone === 'secondary') return <Badge variant="secondary">{text}</Badge>;
  return <Badge className={toneClassMap[tone]}>{text}</Badge>;
}
