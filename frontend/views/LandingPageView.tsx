import Link from 'next/link';
import { Activity, ArrowRight, Database, FlaskConical, Layers, Sparkles, TrendingUp, Zap } from 'lucide-react';
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
    <main className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -inset-x-40 -top-24 h-[720px] bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.24),transparent_70%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_65%)] opacity-80 blur-3xl animate-aurora" />
        <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[140px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] animate-drift" />
        <div className="absolute inset-0 bg-grid opacity-25" />
      </div>

      <section className="container flex flex-col items-center py-12 text-center sm:py-20 lg:py-28">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 shadow-[var(--glow-primary)] backdrop-blur">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Bitcoin-first trading research</span>
        </div>

        <h1 className="max-w-5xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-gradient">Bitcoin Experimental Engine</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          A framework for reproducible quantitative research on BTCUSDT spot markets.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button asChild variant="hero" size="lg" className="group">
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

      <section className="container border-t border-border/60 py-12 sm:py-16 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">The complete BEE workflow</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">From data ingestion to controlled experiment evaluation in one reproducible cycle.</p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-5 sm:p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--glow-primary)]">
              <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:text-xl">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container py-12 text-center sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-gradient-card p-6 sm:p-8 shadow-[var(--glow-accent)] backdrop-blur">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2 text-accent">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Research-first design</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Built for reproducible experimentation</h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            BEE focuses on structured, auditable Bitcoin-pair research with strict temporal integrity, parametric control, and consistent experiment tracking.
          </p>
        </div>
      </section>
    </main>
  );
}