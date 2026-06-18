"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  experiments: 'Experiments',
  blueprints: 'Blueprints',
  models: 'Models',
  hub: 'Public Hub',
  docs: 'Documentation',
  admin: 'Admin',
  users: 'Users',
  jobs: 'Jobs',
  profile: 'Profile',
  system: 'System',
  moderation: 'Moderation',
  new: 'New',
};

function toLabel(segment: string) {
  return LABELS[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  return (
    <div className="border-b border-border/50 bg-background/50 px-4 py-2 backdrop-blur-md sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-primary/10 hover:text-primary">
          <Home className="h-3 w-3" />
          <span className="sr-only sm:not-sr-only">Home</span>
        </Link>
        {parts.map((segment, index) => {
          const href = `/${parts.slice(0, index + 1).join('/')}`;
          const last = index === parts.length - 1;
          return (
            <span key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              {last ? (
                <span className="font-medium text-foreground">{toLabel(segment)}</span>
              ) : (
                <Link href={href} className="rounded px-1 py-0.5 transition-colors hover:bg-primary/10 hover:text-primary">
                  {toLabel(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}