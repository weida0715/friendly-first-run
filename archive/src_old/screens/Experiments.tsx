"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { mockApiExperiments, mockApiUsers } from '@/data/app-data';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  CheckCircle2,
  Clock,
  FlaskConical,
  MoreVertical,
  Search,
  Trash2,
  XCircle,
  Ban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type ApiExperimentRecord = {
  experiment_id: string;
  owner_user_id: string;
  name: string;
  visibility: string;
  market_symbol: string;
  data_interval: string;
  status?: string;
  progress?: number;
  queue_position?: number;
  results_json?: { sharpe?: number; totalReturn?: number } | null;
  config_json?: { blueprint?: string } | null;
};

type ApiUserRecord = {
  user_id?: string;
  id?: string;
  username?: string;
};

export default function Experiments() {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experiments, setExperiments] = useState<ApiExperimentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadExperiments = () => {
      setIsLoading(true);
      const experimentsData = mockApiExperiments() as ApiExperimentRecord[];
      let visibleExperiments = experimentsData;

      if (!isAdmin) {
        const apiUsers = mockApiUsers() as ApiUserRecord[];
        const ownerMatch = apiUsers.find((apiUser) => apiUser.username === user?.username);
        const ownerUserId = ownerMatch?.user_id || ownerMatch?.id || user?.id;

        visibleExperiments = ownerUserId
          ? experimentsData.filter((exp) => exp.owner_user_id === ownerUserId)
          : experimentsData;

        // Never show an empty records state in mock mode if data exists.
        if (visibleExperiments.length === 0 && experimentsData.length > 0) {
          visibleExperiments = experimentsData;
        }
      }

      if (!active) return;
      setExperiments(visibleExperiments);
      setIsLoading(false);
    };
    loadExperiments();
    return () => {
      active = false;
    };
  }, [isAdmin, user?.id, user?.username]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      const name = (exp.name || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const status = (exp.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [experiments, isAdmin, searchQuery, statusFilter, user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Completed</Badge>;
      case 'running':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Running</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">Cancelled</Badge>;
      case 'queued':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Queued</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'running':
        return <Activity className="h-5 w-5 animate-pulse text-primary" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Experiment Runs</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and monitor your research experiments
            </p>
          </div>
          <Link href="/experiments/new">
            <Button variant="hero" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              New Experiment
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-card">
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Experiments List */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>All Experiments</CardTitle>
            <CardDescription>
              {filteredExperiments.length} experiment{filteredExperiments.length !== 1 ? 's' : ''} found
              {isLoading && ' • loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExperiments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No experiments found</h3>
                <p className="mt-1 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by creating your first experiment'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Link href="/experiments/new">
                    <Button variant="hero" className="mt-4">
                      Create Experiment
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExperiments.map((exp) => (
                  <Link
                    key={exp.experiment_id}
                    href={`/experiments/${exp.experiment_id}`}
                    className="block"
                  >
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background/50 p-4 transition-all hover:border-primary/50 hover:bg-background sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          {getStatusIcon((exp.status || '').toLowerCase())}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold break-words">{exp.name}</p>
                            {getStatusBadge((exp.status || '').toLowerCase())}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono">{exp.market_symbol}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-mono">{exp.data_interval}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-mono break-words">
                              {exp.config_json?.blueprint ?? 'blueprint'}
                            </span>
                            {exp.status === 'QUEUED' && typeof exp.queue_position === 'number' && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>Queue #{exp.queue_position}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                        {exp.status === 'RUNNING' && (
                          <div className="hidden items-center gap-2 sm:flex">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${exp.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {exp.progress || 0}%
                            </span>
                          </div>
                        )}
                        {exp.results_json && (
                          <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-success">
                              Sharpe: {exp.results_json.sharpe?.toFixed?.(2) ?? exp.results_json.sharpe}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Return: {exp.results_json.totalReturn?.toFixed?.(1) ?? exp.results_json.totalReturn}%
                            </p>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {exp.status === 'RUNNING' || exp.status === 'QUEUED' ? (
                              <DropdownMenuItem
                                onClick={() => toast.success(`Cancelled ${exp.name}`)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
