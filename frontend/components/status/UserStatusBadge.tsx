import { StatusBadge, type StatusVariantMap } from './StatusBadge';

function normalizeStatus(status: string): 'Enabled' | 'Disabled' | 'Other' {
  const value = status.trim().toLowerCase();
  if (value === 'enabled') return 'Enabled';
  if (value === 'disabled') return 'Disabled';
  return 'Other';
}

export function UserStatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const map: StatusVariantMap = {
    enabled: 'success',
    disabled: 'destructive',
    other: 'outline',
  };

  if (normalized === 'Other') {
    return <StatusBadge status={status} label={status} map={map} />;
  }

  return <StatusBadge status={normalized} label={normalized} map={map} />;
}
