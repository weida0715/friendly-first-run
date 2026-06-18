"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import NewExperiment from "@/screens/NewExperiment";

export default function Page() {
  return (
    <ProtectedRoute>
      <NewExperiment />
    </ProtectedRoute>
  );
}

