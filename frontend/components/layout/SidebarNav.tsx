"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getSectionNavItems } from '@/lib/routes/nav';
import { useAuth } from '@/lib/auth/useAuth';

interface SidebarNavProps {
  mobile?: boolean;
}

export function SidebarNav({ mobile = false }: SidebarNavProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const coreItems = getSectionNavItems({ isAuthenticated, role: user?.role, section: 'core' });
  const adminItems = getSectionNavItems({ isAuthenticated, role: user?.role, section: 'admin' });

  return (
    <aside
      className={cn(
        'w-72 shrink-0 border-r bg-card/40',
        mobile ? 'flex h-full flex-col' : 'hidden lg:flex lg:flex-col',
      )}
      data-sidebar-nav
    >
      <div className="border-b px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bitcoin Experimental Engine</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core</p>
          <nav className="space-y-1">
            {coreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </section>

        {adminItems.length > 0 ? (
          <section>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Administration</p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
              })}
            </nav>
          </section>
        ) : null}
      </div>
    </aside>
  );
}