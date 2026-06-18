import Link from 'next/link';
import { Activity, ArrowRight, BarChart3, Database, FlaskConical, Layers, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Database, title: 'Historical Data', description: 'Work from BTCUSDT spot market data with consistent ingestion for reproducible experiments.' },
  { icon: Layers, title: 'Indicators & Features', description: 'Compose technical indicators and strategy features without losing auditability.' },
  { icon: FlaskConical, title: 'Experiments', description: 'Run split-first evaluations that preserve temporal integrity across every backtest.' },
  { icon: Zap, title: 'Blueprint Governance', description: 'Define reusable blueprints and promote only reviewed strategy designs.' },
  { icon: TrendingUp, title: 'Model Rankings', description: 'Compare completed models with Sharpe, drawdown, win rate, and other metrics.' },
];

export function LandingPageView() {
  return (
    <main className="relative isolate -m-6 min-h-[calc(100vh-3.5rem)] overflow-hidden bg-background px-4 py-16 sm:-m-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -inset-x-40 -top-24 -z-10 h-[720px] bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.24),transparent_70%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_65%)] opacity-80 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      <section className="container flex flex-col items-center py-16 text-center md:py-24 lg:py-32">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 shadow-[0_0_30px_hsl(var(--primary)/0.18)] backdrop-blur">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Bitcoin-first trading research</span>
        </div>

        <h1 className="max-w-5xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">Bitcoin Experimental Engine</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          A framework for reproducible quantitative research on BTCUSDT spot markets.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="hero" size="lg" className="group shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
            <Link href="/register">
              Start Experimenting
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-primary/40 bg-background/40 backdrop-blur">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="container border-t border-border py-16 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">The complete BEE workflow</h2>
          <p className="mt-4 text-muted-foreground">From data ingestion to controlled experiment evaluation in one reproducible cycle.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
              <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container py-16 text-center md:py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/50 p-8 backdrop-blur">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2 text-accent">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Research-first design</span>
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">Built for reproducible experimentation</h2>
          <p className="mt-5 text-muted-foreground">
            BEE focuses on structured, auditable Bitcoin-pair research with strict temporal integrity, parametric control, and consistent experiment tracking.
          </p>
        </div>
      </section>
    </main>
  );
}