"use client";

import { useEffect, useMemo, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormFieldRow } from '@/components/forms/FormFieldRow';
import { DataTable } from '@/components/tables/DataTable';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { TableEmptyRow } from '@/components/tables/TableEmptyRow';
import { LoadingState } from '@/components/states/LoadingState';
import { ErrorState } from '@/components/states/ErrorState';
import { ConfirmDialogCard } from '@/components/ui/ConfirmDialogCard';
import { SelectField } from '@/components/forms/SelectField';
import { useAuth } from '@/lib/auth/useAuth';
import {
  ApiClientError,
  createManagedUser,
  deleteManagedUser,
  getUserAuditTrail,
  listUsers,
  getPublicProfile,
  resetManagedUserPassword,
  type UserAuditItem,
  type UserListItem,
  updateManagedUserRole,
  updateManagedUserStatus,
} from '@/lib/api/client';
import { UserRoleBadge } from '@/components/status/UserRoleBadge';
import { UserStatusBadge } from '@/components/status/UserStatusBadge';

type Role = 'User' | 'Moderator' | 'Admin';

function normalizeRole(role: string): Role {
  const v = role.trim().toLowerCase();
  if (v === 'admin' || v === 'administrator') return 'Admin';
  if (v === 'moderator' || v === 'mod') return 'Moderator';
  return 'User';
}

export function UserManagementView() {
  const { user } = useAuth();
  const actorRole = normalizeRole(user?.role ?? 'User');
  const isAdmin = actorRole === 'Admin';
  const isStaff = actorRole === 'Moderator' || actorRole === 'Admin';

  const [items, setItems] = useState<UserListItem[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'User' as Role,
  });

  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [roleTarget, setRoleTarget] = useState<UserListItem | null>(null);
  const [roleValue, setRoleValue] = useState<Role>('User');
  const [auditTarget, setAuditTarget] = useState<UserListItem | null>(null);
  const [auditItems, setAuditItems] = useState<UserAuditItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditSummary, setAuditSummary] = useState<{ experiments: number; models: number; blueprints: number; loginStatus: string } | null>(null);

  const canManageTarget = (target: UserListItem) => {
    const targetRole = normalizeRole(target.role);
    if (isAdmin) return true;
    if (actorRole === 'Moderator') return targetRole === 'User';
    return false;
  };

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listUsers({ q: query || undefined, role: roleFilter || undefined, status: statusFilter || undefined, page: 1, pageSize: 25 });
      setItems(res.data?.items ?? []);
    } catch (e) {
      const message = e instanceof ApiClientError ? e.message : 'Failed to load users';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      void reload();
    }
  }, [isStaff]);

  useEffect(() => {
    if (!auditTarget) {
      setAuditItems([]);
      setAuditSummary(null);
      return;
    }

    let cancelled = false;
    setAuditLoading(true);
    setAuditError(null);
    void Promise.all([getUserAuditTrail(auditTarget.id), getPublicProfile(auditTarget.id)])
      .then(([auditRes, profileRes]) => {
        if (cancelled) return;
        setAuditItems(auditRes.data?.items ?? []);
        setAuditSummary({
          experiments: profileRes.data?.experiments?.length ?? 0,
          models: profileRes.data?.models?.length ?? 0,
          blueprints: profileRes.data?.blueprints?.length ?? 0,
          loginStatus: String(profileRes.data?.user?.status ?? auditTarget.status ?? 'Unknown'),
        });
      })
      .catch((e) => {
        if (cancelled) return;
        const message = e instanceof ApiClientError ? e.message : 'Failed to load audit trail';
        setAuditError(message);
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auditTarget]);

  const filtered = useMemo(() => items, [items]);
  const totalUsers = items.length;
  const activeUsers = items.filter((u) => u.status.toLowerCase() === 'enabled').length;
  const staffUsers = items.filter((u) => {
    const role = normalizeRole(u.role);
    return role === 'Admin' || role === 'Moderator';
  }).length;

  return (
    <BaseView title="User Management" description="Administer users and access roles.">
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{totalUsers}</p></CardContent></Card>
        <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active Users</p><p className="text-2xl font-bold">{activeUsers}</p></CardContent></Card>
        <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Staff Users</p><p className="text-2xl font-bold">{staffUsers}</p></CardContent></Card>
        <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Actions</p><p className="text-2xl font-bold">0</p></CardContent></Card>
      </div>

      <Card className="mb-4 bg-gradient-card">
        <CardHeader>
          <CardTitle>Access Scope</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Admin visibility: full user lifecycle controls are available.'
            : isStaff
              ? 'Moderator visibility: user-level account operations only.'
              : 'Read-only visibility: management actions are restricted by role guard policy.'}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <TableToolbar>
            <Input placeholder="Search name, username, email" value={query} onChange={(e) => setQuery(e.target.value)} />
            <SelectField
              value={roleFilter}
              onValueChange={setRoleFilter}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'User', label: 'User' },
                { value: 'Moderator', label: 'Moderator' },
                { value: 'Admin', label: 'Admin' },
              ]}
            />
            <SelectField
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Enabled', label: 'Enabled' },
                { value: 'Disabled', label: 'Disabled' },
              ]}
            />
            <div className="flex gap-2">
              <Button onClick={() => void reload()}>Apply</Button>
              {isStaff ? (
                <Button variant="outline" onClick={() => setCreateOpen((v) => !v)}>
                  {createOpen ? 'Close Create' : 'Create User'}
                </Button>
              ) : null}
            </div>
          </TableToolbar>
          {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
        </CardContent>
      </Card>

      {createOpen ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
            {isAdmin ? (
              <FormFieldRow label="Role">
                <SelectField
                  value={createForm.role}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v as Role }))}
                  options={[
                    { value: 'User', label: 'User' },
                    { value: 'Moderator', label: 'Moderator' },
                    { value: 'Admin', label: 'Admin' },
                  ]}
                />
              </FormFieldRow>
            ) : null}
            <div className="md:col-span-2">
              <Button
                onClick={async () => {
                  try {
                    setError(null);
                    await createManagedUser(createForm);
                    setCreateForm({ name: '', username: '', email: '', password: '', role: 'User' });
                    setCreateOpen(false);
                    await reload();
                  } catch (e) {
                    const message = e instanceof ApiClientError ? e.message : 'Failed to create user';
                    setError(message);
                  }
                }}
              >
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState /> : null}
          <DataTable>
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Name</th>
                <th className="py-2">Username</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && filtered.length === 0 ? <TableEmptyRow colSpan={6} message="No users found." /> : null}
              {filtered.map((u) => {
                  const canManage = canManageTarget(u);
                  const isEnabled = u.status.toLowerCase() === 'enabled';
                  return (
                    <tr key={String(u.id)} className="border-b align-top">
                      <td className="py-2 pr-2">{u.name}</td>
                      <td className="py-2 pr-2">{u.username}</td>
                      <td className="py-2 pr-2">{u.email}</td>
                      <td className="py-2 pr-2"><UserRoleBadge role={u.role} /></td>
                      <td className="py-2 pr-2"><UserStatusBadge status={u.status} /></td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          {isStaff ? (
                            <Button size="sm" variant="outline" onClick={() => setAuditTarget(u)}>
                              Audit
                            </Button>
                          ) : null}
                          {canManage ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  setError(null);
                                  await updateManagedUserStatus(u.id, isEnabled ? 'Disabled' : 'Enabled');
                                  await reload();
                                } catch (e) {
                                  const message = e instanceof ApiClientError ? e.message : 'Failed to update user status';
                                  setError(message);
                                }
                              }}
                            >
                              {isEnabled ? 'Disable' : 'Enable'}
                            </Button>
                          ) : null}

                          {canManage ? (
                            <Button size="sm" variant="outline" onClick={() => setResetTarget(u)}>
                              Reset Password
                            </Button>
                          ) : null}

                          {isAdmin ? (
                            <Button size="sm" variant="outline" onClick={() => { setRoleTarget(u); setRoleValue(normalizeRole(u.role)); }}>
                              Update Role
                            </Button>
                          ) : null}

                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  setError(null);
                                  await deleteManagedUser(u.id);
                                  await reload();
                                } catch (e) {
                                  const message = e instanceof ApiClientError ? e.message : 'Failed to delete user';
                                  setError(message);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      {resetTarget ? (
        <ConfirmDialogCard title={`Reset Password: ${resetTarget.username}`}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>New Password</Label>
              <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            </div>
            <Button
              onClick={async () => {
                try {
                  setError(null);
                  await resetManagedUserPassword(resetTarget.id, resetPassword);
                  setResetPassword('');
                  setResetTarget(null);
                } catch (e) {
                  const message = e instanceof ApiClientError ? e.message : 'Failed to reset password';
                  setError(message);
                }
              }}
            >Confirm</Button>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
          </div>
        </ConfirmDialogCard>
      ) : null}

      {roleTarget ? (
        <ConfirmDialogCard title={`Update Role: ${roleTarget.username}`}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Role</Label>
              <SelectField
                value={roleValue}
                onValueChange={(v) => setRoleValue(v as Role)}
                options={[
                  { value: 'User', label: 'User' },
                  { value: 'Moderator', label: 'Moderator' },
                  { value: 'Admin', label: 'Admin' },
                ]}
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  setError(null);
                  await updateManagedUserRole(roleTarget.id, roleValue);
                  setRoleTarget(null);
                  await reload();
                } catch (e) {
                  const message = e instanceof ApiClientError ? e.message : 'Failed to update role';
                  setError(message);
                }
              }}
            >Confirm</Button>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button>
          </div>
        </ConfirmDialogCard>
      ) : null}

      {auditTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setAuditTarget(null)}
          role="presentation"
        >
          <Card
            className="max-h-[85vh] w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Audit Trail: {auditTarget.username}</CardTitle>
                <p className="text-sm text-muted-foreground">User history, login status, and related activity snapshot.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={`/profile?userId=${auditTarget.id}`}>Open User Page</a>
                </Button>
                <Button variant="outline" onClick={() => setAuditTarget(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto text-sm">
              {auditSummary ? (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Card className="bg-muted/30"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Login Status</p><p className="font-medium">{auditSummary.loginStatus}</p></CardContent></Card>
                  <Card className="bg-muted/30"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Experiments</p><p className="font-medium">{auditSummary.experiments}</p></CardContent></Card>
                  <Card className="bg-muted/30"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Models</p><p className="font-medium">{auditSummary.models}</p></CardContent></Card>
                  <Card className="bg-muted/30"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Blueprints</p><p className="font-medium">{auditSummary.blueprints}</p></CardContent></Card>
                </div>
              ) : null}
              {auditLoading ? <LoadingState message="Loading audit trail..." /> : null}
              {auditError ? <ErrorState message={auditError} /> : null}
              {!auditLoading && !auditError && auditItems.length === 0 ? (
                <p className="text-muted-foreground">No audit events available for this user.</p>
              ) : null}
              {!auditLoading && !auditError && auditItems.length > 0 ? (
                <div className="space-y-3">
                  {auditItems.map((item) => (
                    <div key={`${item.timestamp}-${item.action}`} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>{item.action}</strong>
                        <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">By {item.actor}</p>
                      <p className="mt-1">{item.details}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </BaseView>
  );
}
