import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'BEE | Bitcoin Experimental Engine',
  description: 'Reproducible quantitative research on BTCUSDT spot markets.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="cyan" data-mode="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}