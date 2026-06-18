"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
