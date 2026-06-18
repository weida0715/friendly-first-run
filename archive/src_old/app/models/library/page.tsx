"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ModelsLibrary from "@/screens/ModelsLibrary";

export default function Page() {
  return (
    <ProtectedRoute>
      <ModelsLibrary />
    </ProtectedRoute>
  );
}

