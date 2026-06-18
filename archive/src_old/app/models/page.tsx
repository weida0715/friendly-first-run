"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Models from "@/screens/Models";

export default function Page() {
  return (
    <ProtectedRoute>
      <Models />
    </ProtectedRoute>
  );
}

