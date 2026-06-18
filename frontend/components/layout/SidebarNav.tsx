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
        'w-72 shrink-0 border-r border-sidebar-border/60 bg-sidebar/70 text-sidebar-foreground backdrop-blur-xl',
        mobile ? 'flex h-full flex-col' : 'hidden lg:flex lg:flex-col',
      )}
      data-sidebar-nav
    >
      <div className="border-b border-sidebar-border/60 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Bitcoin Experimental Engine</p>
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
                    'group/nav relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:translate-x-0.5',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-transform', active && 'scale-110')} />
                  <span className="truncate">{item.label}</span>
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
                    'group/nav relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:translate-x-0.5',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-transform', active && 'scale-110')} />
                  <span className="truncate">{item.label}</span>
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