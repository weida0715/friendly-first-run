"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
  staffOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  staffOnly?: boolean;
}) {
  const { isAuthenticated, isAdmin, isStaff, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (staffOnly && !isStaff) {
      router.replace("/dashboard");
    }
  }, [adminOnly, isAuthenticated, isAdmin, isReady, router, staffOnly, isStaff]);

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated || (adminOnly && !isAdmin) || (staffOnly && !isStaff)) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
