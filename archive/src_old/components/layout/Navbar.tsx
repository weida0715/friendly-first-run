"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Activity,
  Bookmark,
  BookOpen,
  FlaskConical,
  Globe,
  LayoutDashboard,
  LogOut,
  Rocket,
  Shield,
  User,
  FileCode,
  Menu,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

type NavbarProps = {
  hideThemeSwitcherOnMobile?: boolean;
};

export function Navbar({ hideThemeSwitcherOnMobile = false }: NavbarProps) {
  const { user, isAuthenticated, isStaff, isAdmin, isModerator, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive(path) ? 'text-primary' : 'text-muted-foreground'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">BEE</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                <span className="flex items-center gap-1">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </span>
              </Link>
              <Link href="/models" className={navLinkClass('/models')}>
                <span className="flex items-center gap-1">
                  <Rocket className="h-3.5 w-3.5" />
                  Models Rankings
                </span>
              </Link>
              <Link href="/experiments/new" className={navLinkClass('/experiments/new')}>
                <span className="flex items-center gap-1">
                  <FlaskConical className="h-3.5 w-3.5" />
                  New Experiment
                </span>
              </Link>
              <Link href="/public-hub" className={navLinkClass('/public-hub')}>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Public Hub
                </span>
              </Link>
              <Link href="/docs" className={navLinkClass('/docs')}>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Documentation
                </span>
              </Link>
              {isStaff && (
                <Link href="/admin" className={navLinkClass('/admin')}>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'Staff'}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Activity className="h-5 w-5 text-primary-foreground" />
                    </div>
                    BEE
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/models" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                      <Rocket className="h-4 w-4" />
                      Models Rankings
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/experiments/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                      <FlaskConical className="h-4 w-4" />
                      New Experiment
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/public-hub" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                      <Globe className="h-4 w-4" />
                      Public Hub
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/docs" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                      <BookOpen className="h-4 w-4" />
                      Documentation
                    </Link>
                  </SheetClose>
                  {isStaff && (
                    <SheetClose asChild>
                      <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                        <Shield className="h-4 w-4" />
                        {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'Staff'}
                      </Link>
                    </SheetClose>
                  )}
                </nav>
                <Separator className="my-4" />
              </SheetContent>
            </Sheet>
          )}
          <div className={hideThemeSwitcherOnMobile ? 'hidden sm:flex' : 'flex'}>
            <ThemeSwitcher />
          </div>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/experiments" className="flex items-center">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    My Experiments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/models/library" className="flex items-center">
                    <Bookmark className="mr-2 h-4 w-4" />
                    My Models
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sfms" className="flex items-center">
                    <FileCode className="mr-2 h-4 w-4" />
                    Blueprints Library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="hero">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
