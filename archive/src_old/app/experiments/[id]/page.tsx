"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ExperimentDetail from "@/screens/ExperimentDetail";

export default function Page() {
  return (
    <ProtectedRoute>
      <ExperimentDetail />
    </ProtectedRoute>
  );
}

