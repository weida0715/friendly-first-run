"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BaseView } from './BaseView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClientError, getMyProfile, getPublicProfile, type CurrentUser } from '@/lib/api/client';
import { UserRoleBadge } from '@/components/status/UserRoleBadge';
import { UserStatusBadge } from '@/components/status/UserStatusBadge';

export function UserProfileView() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState<CurrentUser | Record<string, unknown> | null>(null);
  const [artifacts, setArtifacts] = useState<Record<'experiments' | 'models' | 'blueprints', Array<Record<string, unknown>>> | null>(null);
  const [summary, setSummary] = useState<{ experiments?: number; models?: number; blueprints?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (userId) {
          const response = await getPublicProfile(userId);
          if (mounted) {
            setUser(response.data?.user ?? null);
            setArtifacts({
              experiments: response.data?.experiments ?? [],
              models: response.data?.models ?? [],
              blueprints: response.data?.blueprints ?? [],
            });
            setSummary(response.data?.summary ?? null);
          }
        } else {
          const response = await getMyProfile();
          if (mounted) setUser(response.data?.user ?? null);
        }
      } catch (e) {
        const message = e instanceof ApiClientError ? e.message : 'Failed to load profile';
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <BaseView title="User Profile" description={userId ? "Public research activity." : "Manage profile details and research activity."}>
      <Card>
        <CardHeader>
          <CardTitle>{userId ? 'Public Profile' : 'My Profile'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading profile...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {user ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{String(user.name ?? '—')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-medium">{String(user.username ?? '—')}</p>
              </div>
              {!userId ? <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{String(user.email ?? '—')}</p>
              </div> : null}
              {!userId ? <div className="flex gap-2">
                <UserRoleBadge role={String(user.role ?? 'User')} />
                <UserStatusBadge status={String(user.status ?? 'Enabled')} />
              </div> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {summary ? (
        <div className="grid gap-3 md:grid-cols-3">
          {(['experiments', 'models', 'blueprints'] as const).map((kind) => (
            <Card key={kind}>
              <CardContent className="pt-4">
                <p className="text-xs capitalize text-muted-foreground">{kind}</p>
                <p className="text-2xl font-semibold">{Number(summary[kind] ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {artifacts ? (
        <Card>
          <CardHeader><CardTitle>Public Artifacts</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {(['experiments', 'models', 'blueprints'] as const).map((kind) => (
              <div key={kind} className="space-y-2">
                <p className="text-sm font-medium capitalize">{kind}</p>
                {artifacts[kind].length ? artifacts[kind].map((item) => (
                  <Link key={`${kind}-${String(item.id)}`} href={String(item.detailPath ?? '#')} className="block rounded border p-3 text-sm hover:bg-muted/30">
                    {String(item.name ?? item.parameterHash ?? `#${String(item.id ?? '')}`)}
                  </Link>
                )) : <p className="text-sm text-muted-foreground">None yet.</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </BaseView>
  );
}
