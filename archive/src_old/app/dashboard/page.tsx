"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/screens/Dashboard";

export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

