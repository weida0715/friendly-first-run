"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Admin from "@/screens/Admin";

export default function Page() {
  return (
    <ProtectedRoute staffOnly>
      <Admin />
    </ProtectedRoute>
  );
}

