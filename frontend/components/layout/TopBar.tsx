"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, BookOpen, Globe, Menu, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSectionNavItems } from '@/lib/routes/nav';
import { useAuth } from '@/lib/auth/useAuth';
import { THEMES, useTheme, type Theme } from '@/lib/theme/ThemeProvider';

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onOpenMobileNav}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/landing" className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-accent text-primary-foreground shadow-[var(--glow-primary)]">
              <Activity className="h-4 w-4" />
            </span>
            <span className="truncate">BEE</span>
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

        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher />
          {!isLoading && isAuthenticated ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:inline">{user?.username}</span>
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

const THEME_SWATCH: Record<Theme, string> = {
  cyan:    'hsl(187 85% 53%)',
  emerald: 'hsl(142 76% 45%)',
  violet:  'hsl(263 70% 58%)',
  amber:   'hsl(38 92% 50%)',
  rose:    'hsl(346 77% 55%)',
  blue:    'hsl(217 91% 60%)',
  sunset:  'hsl(18 94% 58%)',
  midnight:'hsl(241 70% 62%)',
  aurora:  'hsl(174 82% 48%)',
};

function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={toggleMode} aria-label="Toggle light/dark">
          {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-label="Choose theme">
          <Palette className="h-4 w-4" />
          <span className="ml-1 hidden h-3 w-3 rounded-full sm:inline-block" style={{ background: THEME_SWATCH[theme] }} />
        </Button>
      </div>
      {open ? (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-border/60 bg-popover p-2 shadow-xl">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</p>
            <div className="grid grid-cols-3 gap-1.5 p-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTheme(t); setOpen(false); }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-[10px] capitalize transition-colors hover:border-border hover:bg-muted',
                    t === theme && 'border-primary/60 bg-primary/10 text-primary',
                  )}
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: THEME_SWATCH[t] }} />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}