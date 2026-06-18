"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

type Role = 'User' | 'Moderator' | 'Admin';

const roleRank: Record<Role, number> = {
  User: 1,
  Moderator: 2,
  Admin: 3,
};

function normalizeRole(role: string | undefined | null): Role {
  const v = String(role ?? '').trim().toLowerCase();
  if (v === 'admin' || v === 'administrator') return 'Admin';
  if (v === 'moderator' || v === 'mod') return 'Moderator';
  return 'User';
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function RequireRole({
  minimumRole,
  fallbackTo = '/dashboard',
  children,
}: {
  minimumRole: Role;
  fallbackTo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();

  const authorized =
    !!user &&
    roleRank[normalizeRole(user.role)] >= roleRank[minimumRole];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isLoading && isAuthenticated && !authorized) {
      router.replace(fallbackTo);
    }
  }, [isLoading, isAuthenticated, authorized, fallbackTo, router]);

  if (isLoading || !isAuthenticated || !authorized) {
    return null;
  }

  return <>{children}</>;
}
