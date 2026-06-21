"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';

function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
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
        <div className="h-full overflow-y-auto">
          <SidebarNav mobile />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const isAuthRoute = useMemo(() => ['/login', '/register'].includes(pathname), [pathname]);
  const isLandingRoute = pathname === '/landing' || (pathname === '/' && !isLoading && !isAuthenticated);

  const decor = (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.18]" />
      <div className="absolute -inset-x-40 -top-24 h-[620px] bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_70%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.16),transparent_65%)] opacity-80 blur-3xl animate-aurora" />
    </div>
  );

  if (isAuthRoute) {
    return (
      <div className={cn('relative min-h-screen bg-background', isTouch && 'touch-optimizations')}>
        {decor}
        {children}
      </div>
    );
  }

  if (isLandingRoute) {
    return (
      <div className={cn('relative min-h-screen bg-background', isTouch && 'touch-optimizations')}>
        {decor}
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        {children}
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-screen bg-background', isTouch && 'touch-optimizations')}>
      {decor}
      <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      {mobileOpen ? <MobileSidebar onClose={() => setMobileOpen(false)} /> : null}
    </div>
  );
}
