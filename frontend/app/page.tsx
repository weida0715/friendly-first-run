"use client";

import { DashboardView } from '@/views/DashboardView';
import { LandingPageView } from '@/views/LandingPageView';
import { useAuth } from '@/lib/auth/useAuth';

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <DashboardView /> : <LandingPageView />;
}