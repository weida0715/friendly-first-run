import { StatusBadge, type StatusVariantMap } from './StatusBadge';

function normalizeRole(role: string): 'User' | 'Moderator' | 'Admin' {
  const value = role.trim().toLowerCase();
  if (value === 'admin' || value === 'administrator') return 'Admin';
  if (value === 'moderator' || value === 'mod') return 'Moderator';
  return 'User';
}

export function UserRoleBadge({ role }: { role: string }) {
  const normalized = normalizeRole(role);
  const map: StatusVariantMap = {
    admin: 'destructive',
    moderator: 'warning',
    user: 'secondary',
  };

  return <StatusBadge status={normalized} label={normalized} map={map} />;
}
