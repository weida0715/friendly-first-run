import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

export interface BaseViewProps {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | Error | null;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode;
}

function BaseViewLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function BaseViewError({ error }: { error: string | Error }) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>We couldn&apos;t render this page section right now.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-destructive">{message}</CardContent>
    </Card>
  );
}

export function BaseView({ title, description, loading = false, error = null, actions, breadcrumbs, children }: BaseViewProps) {
  return (
    <PageShell>
      <PageHeader title={title} description={description} actions={actions} breadcrumbs={breadcrumbs} />
      {loading ? <BaseViewLoading /> : null}
      {!loading && error ? <BaseViewError error={error} /> : null}
      {!loading && !error ? children : null}
    </PageShell>
  );
}