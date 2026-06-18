"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UserProfile from "@/screens/UserProfile";

export default function Page() {
  return (
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  );
}

