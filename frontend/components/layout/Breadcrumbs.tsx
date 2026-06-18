"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <div className="border-b bg-background/80 px-4 py-2 sm:px-6">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {parts.map((segment, index) => {
          const href = `/${parts.slice(0, index + 1).join('/')}`;
          const last = index === parts.length - 1;
          return (
            <span key={href} className="flex items-center gap-1">
              <span>/</span>
              {last ? (
                <span className="font-medium text-foreground">{toLabel(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">{toLabel(segment)}</Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}