"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Experiments from "@/screens/Experiments";

export default function Page() {
  return (
    <ProtectedRoute>
      <Experiments />
    </ProtectedRoute>
  );
}

