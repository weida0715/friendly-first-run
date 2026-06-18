"use client";

import PublicRoute from "@/components/PublicRoute";
import Login from "@/screens/Login";

export default function Page() {
  return (
    <PublicRoute>
      <Login />
    </PublicRoute>
  );
}

