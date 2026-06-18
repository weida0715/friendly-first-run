"use client";

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '@/lib/auth/useAuth';

function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative h-full w-80 max-w-[85vw] border-r bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/" className="text-sm font-semibold" onClick={onClose}>
            Bitcoin Experimental Engine
          </Link>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarNav mobile />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const isAuthRoute = useMemo(() => ['/login', '/register'].includes(pathname), [pathname]);
  const isLandingRoute = pathname === '/landing' || (pathname === '/' && !isLoading && !isAuthenticated);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLandingRoute) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <SidebarNav />
        <section className="flex min-w-0 flex-1 flex-col">
          <Breadcrumbs />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
      {mobileOpen ? <MobileSidebar onClose={() => setMobileOpen(false)} /> : null}
    </div>
  );
}
