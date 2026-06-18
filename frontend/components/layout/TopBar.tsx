"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, BookOpen, Globe, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSectionNavItems } from '@/lib/routes/nav';
import { useAuth } from '@/lib/auth/useAuth';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const topNavItems = getSectionNavItems({ isAuthenticated, role: user?.role, section: 'core' });
  const publicNavItems = [
    { label: 'Public Hub', href: '/hub', icon: Globe },
    { label: 'Documentation', href: '/docs', icon: BookOpen },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onOpenMobileNav}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            BEE
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-muted-foreground xl:flex">
            {(isAuthenticated ? topNavItems : publicNavItems).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-2 py-1 hover:text-foreground',
                      isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">{user?.username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}