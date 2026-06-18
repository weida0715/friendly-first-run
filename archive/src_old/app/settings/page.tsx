"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/screens/Profile";

export default function Page() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

