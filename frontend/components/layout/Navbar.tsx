"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthProvider';

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Experiments', '/experiments'],
  ['Blueprints', '/blueprints'],
  ['Models', '/models'],
  ['Hub', '/hub'],
  ['Docs', '/docs'],
];

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <nav className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          BEE
        </Link>
        <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
          {isAuthenticated
            ? navItems.map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-foreground">
                  {label}
                </Link>
              ))
            : null}
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
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}