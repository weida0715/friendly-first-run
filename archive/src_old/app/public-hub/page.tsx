"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PublicHub from "@/screens/PublicHub";

export default function Page() {
  return (
    <ProtectedRoute>
      <PublicHub />
    </ProtectedRoute>
  );
}

