"use client";

import { Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, themeColors, ThemeColor } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { color, mode, setColor, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Mode</DropdownMenuLabel>
        <div className="flex gap-1 p-1">
          <Button
            variant={mode === 'dark' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 gap-2"
            onClick={() => setMode('dark')}
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={mode === 'light' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 gap-2"
            onClick={() => setMode('light')}
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Color Scheme</DropdownMenuLabel>
        {themeColors.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setColor(t.id)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              color === t.id && 'bg-accent'
            )}
          >
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: t.primary }}
            />
            <span>{t.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
