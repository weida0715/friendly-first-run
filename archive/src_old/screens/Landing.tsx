"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  FlaskConical,
  Layers,
  LineChart,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

export default function Landing() {
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updateTouchState = () => setIsTouch(mediaQuery.matches);
    updateTouchState();
    mediaQuery.addEventListener?.('change', updateTouchState);
    return () => mediaQuery.removeEventListener?.('change', updateTouchState);
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (isTouch) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    setCursor((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-background ${isTouch ? 'touch-optimizations' : ''}`}
      onMouseMove={isTouch ? undefined : handleMouseMove}
      onMouseLeave={isTouch ? undefined : handleMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-x-40 -top-24 h-[720px] bg-[radial-gradient(circle_at_top,hsl(187_85%_53%/0.2),transparent_70%),radial-gradient(circle_at_top_right,hsl(263_70%_58%/0.18),transparent_65%)] opacity-70 blur-3xl animate-aurora" />
        {!isTouch && (
          <>
            <div
              className="absolute bottom-0 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[140px] animate-float"
              style={{ animationDelay: '2s' }}
            />
            <div
              className="absolute bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px] animate-float"
              style={{ animationDelay: '4s' }}
            />
          </>
        )}
      </div>
      {!isTouch && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-500"
          style={{
            opacity: cursor.active ? 0.55 : 0,
            background: `radial-gradient(320px circle at ${cursor.x}px ${cursor.y}px, hsl(187 85% 53% / 0.18), transparent 65%), radial-gradient(220px circle at ${cursor.x}px ${cursor.y}px, hsl(263 70% 58% / 0.12), transparent 70%)`,
          }}
        />
      )}
      <Navbar hideThemeSwitcherOnMobile />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-grid opacity-30" />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="pointer-events-none absolute -inset-x-40 top-0 z-0 h-[560px] bg-[radial-gradient(circle_at_top,hsl(187_85%_53%/0.32),transparent_65%),radial-gradient(circle_at_top_right,hsl(263_70%_58%/0.3),transparent_55%)] opacity-90 blur-3xl animate-aurora" />
        {!isTouch && (
          <>
            <div className="pointer-events-none absolute -left-32 top-10 z-0 h-72 w-72 animate-float rounded-full bg-primary/15 blur-3xl" />
            <div
              className="pointer-events-none absolute right-0 top-40 z-0 h-80 w-80 animate-float rounded-full bg-accent/20 blur-[120px]"
              style={{ animationDelay: '1.5s' }}
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/3 z-0 h-96 w-96 -translate-y-10 animate-float rounded-full bg-primary/10 blur-[140px]"
              style={{ animationDelay: '3s' }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-16 z-0 h-48 w-48 -translate-x-1/2 animate-float rounded-full bg-primary/10 blur-[100px]"
              style={{ animationDelay: '4s' }}
            />
          </>
        )}

        <div className="container relative z-30 flex flex-col items-center justify-center py-24 md:py-32 lg:py-40">
          <div className="animate-fade-in flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 shadow-[0_0_30px_hsl(187_85%_53%/0.18)] backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Bitcoin-First Trading Research</span>
            </div>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl lg:text-7xl">
              <span className="text-gradient">Bitcoin Experimental Engine (BEE)</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              A Framework for Reproducible Quantitative Research on BTCUSDT Spot Markets
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button variant="hero" size="xl" className="group">
                  Start Experimenting
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="xl" className="border-primary/40 bg-background/40 backdrop-blur">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating elements */}
          {!isTouch && (
            <>
              <div className="pointer-events-none absolute left-10 top-1/4 hidden animate-float opacity-25 lg:block">
                <LineChart className="h-24 w-24 text-primary" />
              </div>
              <div
                className="pointer-events-none absolute right-10 top-1/3 hidden animate-float opacity-25 delay-1000 lg:block"
                style={{ animationDelay: '2s' }}
              >
                <BarChart3 className="h-20 w-20 text-accent" />
              </div>
              <div className="pointer-events-none absolute bottom-16 left-16 hidden animate-float opacity-20 lg:block">
                <TrendingUp className="h-16 w-16 text-primary" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-border bg-card/30 py-24">
        <div className="container relative z-30">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">The Complete BEE Workflow</h2>
            <p className="mt-4 text-muted-foreground">
              From data ingestion to controlled experiment evaluation in a single reproducible cycle
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_40px_hsl(187_85%_53%/0.2)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Focus Section */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-56 max-w-4xl rounded-full bg-accent/10 blur-[120px]" />
        <div className="container relative z-30">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2 shadow-[0_0_24px_hsl(263_85%_60%/0.2)] backdrop-blur">
              <Activity className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Research-First Design</span>
            </div>

            <h2 className="text-3xl font-bold md:text-4xl">Built for Reproducible Experimentation</h2>

            <p className="mt-6 text-lg text-muted-foreground">
              BEE focuses on structured, auditable Bitcoin-pair research with strict temporal integrity,
              parametric control, and consistent experiment tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-border bg-card/30 py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative z-30 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Start Researching?</h2>
          <p className="mt-4 text-muted-foreground">
            Join BEE and start your reproducible BTCUSDT experiment workflow
          </p>
          <Link href="/register">
            <Button variant="hero" size="xl" className="mt-8 shadow-[0_0_30px_hsl(187_85%_53%/0.35)]">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-8">
        <div className="container relative z-30 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">BEE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bitcoin Experimental Engine (BEE).
          </p>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-40 flex sm:hidden">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

const features = [
  {
    icon: Database,
    title: 'Historical Data',
    description: 'Access BTCUSDT spot market data with consistent ingestion for reproducible experiments.',
  },
  {
    icon: Layers,
    title: 'Indicators & Features',
    description: 'Rich library of technical indicators and compound features for signal generation.',
  },
  {
    icon: FlaskConical,
    title: 'Experiments',
    description: 'Split-first execution prevents leakage and preserves temporal integrity across runs.',
  },
  {
    icon: Zap,
    title: 'Blueprint Governance',
    description: 'Define versioned Blueprints and reuse them safely across experiment runs.',
  },
  {
    icon: TrendingUp,
    title: 'Model Rankings',
    description: 'Compare completed models using Sharpe ratio, drawdown, win rate, and other metrics.',
  },
];
