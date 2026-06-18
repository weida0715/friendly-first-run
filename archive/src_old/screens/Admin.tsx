"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCode,
  Search,
  Server,
  Shield,
  Trash2,
  UserCog,
  Users,
  XCircle,
  UserPlus,
  KeyRound,
  Edit3,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { mockMeta, mockApiBlueprints } from '@/data/app-data';
import { ApiBlueprintRecord, mapApiBlueprint } from '@/lib/data-utils';

export default function Admin() {
  const {
    users,
    addUser,
    removeUser,
    updateUserRole,
    resetUserPassword,
    updateUsername,
    updateUserStatus,
    user,
    isAdmin,
    isStaff,
  } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'moderator',
  });
  const [editUsername, setEditUsername] = useState<Record<string, string>>({});
  const [resetPassword, setResetPassword] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [maxExperimentConcurrency, setMaxExperimentConcurrency] = useState('0');
  const [maxExperimentPermutations, setMaxExperimentPermutations] = useState('10000');
  const [jobQueues, setJobQueues] = useState<{ experiment: Array<{ id: string; username: string; position: number; submittedAt: Date; status: string }> }>({ experiment: [] });
  const [pendingBlueprints, setPendingBlueprints] = useState<Array<ReturnType<typeof mapApiBlueprint>>>([]);

  useEffect(() => {
    let active = true;
    const loadMeta = () => {
      const meta = mockMeta();
      if (!active) return;

      if (meta.systemConfig) {
        setMaxExperimentConcurrency(String(meta.systemConfig.maxExperimentConcurrency ?? 0));
        setMaxExperimentPermutations(String(meta.systemConfig.maxExperimentPermutations ?? 10000));
      }

      if (meta.jobQueue) {
        const experimentQueue = Array.isArray(meta.jobQueue)
          ? meta.jobQueue
          : meta.jobQueue.experiment || [];

        const mapQueue = (queue: Array<{ id?: string; username?: string; position?: number; submittedAt?: string; status?: string }>) =>
          queue.map((job, index) => ({
            id: job.id || `${index}`,
            username: job.username || 'unknown',
            position: job.position ?? index + 1,
            submittedAt: job.submittedAt ? new Date(job.submittedAt) : new Date(),
            status: job.status || 'queued',
          }));

        setJobQueues({
          experiment: mapQueue(experimentQueue as Array<{ id?: string; username?: string; position?: number; submittedAt?: string; status?: string }>),
        });
      }

      const pending = mockApiBlueprints()
        .filter((blueprint) => (blueprint as ApiBlueprintRecord).approval_status === 'pending')
        .map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord));
      setPendingBlueprints(pending);
    };

    loadMeta();
    return () => {
      active = false;
    };
  }, [user]);

  const handleApprove = async (id: string) => {
    if (!user?.id) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success('Blueprint approved and added to catalog');
    setPendingBlueprints((prev) => prev.filter((blueprint) => blueprint.id !== id));
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.error('Blueprint rejected');
    setPendingBlueprints((prev) => prev.filter((blueprint) => blueprint.id !== id));
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast.error('Please complete all fields');
      return;
    }
    const result = await addUser(newUser);
    if (result.success) {
      toast.success('User created');
      setNewUser({ name: '', username: '', email: '', password: '', role: 'user' });
    } else {
      toast.error(result.error || 'Failed to create user');
    }
  };

  const handleRemove = async (userId: string) => {
    const ok = await removeUser(userId);
    if (ok) toast.success('User removed');
    else toast.error('Unable to remove user');
  };

  const handleRoleChange = async (userId: string, role: 'user' | 'admin' | 'moderator') => {
    const ok = await updateUserRole(userId, role);
    if (ok) toast.success('Role updated');
    else toast.error('Unable to update role');
  };

  const handleResetPassword = async (userId: string) => {
    const newPass = resetPassword[userId];
    if (!newPass) {
      toast.error('Enter a new password');
      return;
    }
    const ok = await resetUserPassword(userId, newPass);
    if (ok) {
      toast.success('Password reset');
      setResetPassword((prev) => ({ ...prev, [userId]: '' }));
    } else {
      toast.error('Unable to reset password');
    }
  };

  const handleUsernameUpdate = async (userId: string) => {
    const nextUsername = editUsername[userId];
    if (!nextUsername) {
      toast.error('Enter a new username');
      return;
    }
    const result = await updateUsername(userId, nextUsername);
    if (result.success) {
      toast.success('Username updated');
      setEditUsername((prev) => ({ ...prev, [userId]: '' }));
    } else {
      toast.error(result.error || 'Unable to update username');
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const ok = await updateUserStatus(userId, !isActive);
    if (ok) toast.success(isActive ? 'User disabled' : 'User enabled');
    else toast.error('Unable to update status');
  };


  const handleUpdateConcurrency = () => {
    toast.success('Concurrency limits updated for this session');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Manage users, system health, and Blueprint approvals
          </p>
        </div>

        {/* System Health Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-lg font-semibold text-success">Healthy</span>
                  </div>
                </div>
                <Server className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Database</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-lg font-semibold">Connected</span>
                  </div>
                </div>
                <Database className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Blueprints</p>
                  <p className="text-2xl font-bold">{pendingBlueprints.length}</p>
                </div>
                <FileCode className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={isStaff ? "users" : "blueprint"} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-card p-2 sm:inline-flex sm:w-auto sm:grid-cols-none">
            {isStaff && (
              <TabsTrigger value="users" className="gap-2">
                <UserCog className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="blueprint" className="gap-2">
              <FileCode className="h-4 w-4" />
              Blueprint Approvals
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="system" className="gap-2">
                <Activity className="h-4 w-4" />
                System
              </TabsTrigger>
            )}
          </TabsList>

          {/* Users Tab */}
          {isStaff && (
            <TabsContent value="users">
            <Card className="bg-gradient-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Add User
                </CardTitle>
                <CardDescription>Create a new account with role and credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input
                    placeholder="Full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Temp password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as 'user' | 'admin' | 'moderator' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex h-10 items-center rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
                        User
                      </div>
                    )}
                    <Button variant="hero" onClick={handleAddUser}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.map((user) => {
                    const isEditing = editingUserId === user.id;
                    const isActive = user.isActive ?? true;
                    return (
                      <div
                        key={user.id}
                        className="rounded-lg border border-border bg-background/50 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                                <Badge
                                  className={
                                    user.role === 'admin'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  }
                                >
                                  {user.role}
                                </Badge>
                                <Badge className={isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                                  {isActive ? 'active' : 'disabled'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {user.email} • @{user.username}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {isAdmin ? (
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value as 'user' | 'admin' | 'moderator')}
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs text-muted-foreground">
                                {user.role}
                              </div>
                            )}
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUserId(isEditing ? null : user.id)}
                              >
                                <Edit3 className="mr-1 h-3.5 w-3.5" />
                                {isEditing ? 'Close' : 'Edit'}
                              </Button>
                            )}
                            <Button
                              variant={isActive ? 'outline' : 'success'}
                              size="sm"
                              disabled={!isAdmin && user.role !== 'user'}
                              onClick={() => handleToggleStatus(user.id, isActive)}
                            >
                              {isActive ? 'Disable' : 'Enable'}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemove(user.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>

                        {isEditing && isAdmin && (
                          <div className="mt-4 rounded-lg border border-border bg-background/40 p-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Update Username</label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="new_username"
                                    value={editUsername[user.id] || ''}
                                    onChange={(e) =>
                                      setEditUsername((prev) => ({ ...prev, [user.id]: e.target.value }))
                                    }
                                  />
                                  <Button variant="outline" onClick={() => handleUsernameUpdate(user.id)}>
                                    Update
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Reset Password</label>
                                <div className="flex gap-2">
                                  <Input
                                    type="password"
                                    placeholder="new password"
                                    value={resetPassword[user.id] || ''}
                                    onChange={(e) =>
                                      setResetPassword((prev) => ({ ...prev, [user.id]: e.target.value }))
                                    }
                                  />
                                  <Button variant="outline" onClick={() => handleResetPassword(user.id)}>
                                    <KeyRound className="mr-1 h-4 w-4" />
                                    Reset
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Blueprint Approvals Tab */}
          <TabsContent value="blueprint">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Pending Blueprint Approvals</CardTitle>
                <CardDescription>Review and approve custom Blueprints</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBlueprints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="mb-4 h-12 w-12 text-success" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="mt-1 text-muted-foreground">No pending Blueprint submissions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingBlueprints.map((blueprint) => (
                      <div
                        key={blueprint.id}
                        className="flex flex-col gap-4 rounded-lg border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{blueprint.name}</p>
                            <p className="text-sm text-muted-foreground">
                              by @{blueprint.authorUsername} • v{blueprint.version}
                              {blueprint.approvalRequestedAt && (
                                <> • Submitted {blueprint.approvalRequestedAt.toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(blueprint.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(blueprint.id)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          {isAdmin && (
          <TabsContent value="system">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gradient-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Job Concurrency Limits
                  </CardTitle>
                  <CardDescription>Configure maximum server-side job concurrency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Experiment Jobs</label>
                      <Input
                        type="number"
                        min={1}
                        value={maxExperimentConcurrency}
                        onChange={(e) => setMaxExperimentConcurrency(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Max Permutations / Experiment</label>
                      <Input
                        type="number"
                        min={1}
                        value={maxExperimentPermutations}
                        onChange={(e) => setMaxExperimentPermutations(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button variant="hero" onClick={handleUpdateConcurrency}>
                        Save Limits
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Data Ingestion Status</CardTitle>
                  <CardDescription>Kline data synchronization status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">BTCUSDT</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Up to date</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last sync</span>
                      <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total records</span>
                      <span className="font-mono text-sm">2,847,392</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>API Usage</CardTitle>
                  <CardDescription>Request statistics for this hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Requests</span>
                      <span className="font-mono text-sm">1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate limit</span>
                      <span className="text-sm text-muted-foreground">10,000/hour</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[12%] bg-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">12% of hourly limit used</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>System errors in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="mb-4 h-12 w-12 text-success" />
                    <h3 className="text-lg font-medium">No errors</h3>
                    <p className="mt-1 text-muted-foreground">System running smoothly</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Job Queue</CardTitle>
                  <CardDescription>Queued and running experiment jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-muted-foreground">Experiment Queue</p>
                    <div className="space-y-3">
                      {jobQueues.experiment.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">EXPERIMENT • {job.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Position #{job.position} • Submitted {job.submittedAt.toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className={job.status === 'running' ? 'bg-primary/10 text-primary' : 'bg-muted'}>
                            {job.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
