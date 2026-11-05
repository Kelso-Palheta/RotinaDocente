"use client";

import { useAuth } from "@/lib/auth-context";
import LandingPage from "@/components/landing/LandingPage";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
      >
        <div
          className="w-9 h-9 rounded-full border-3 animate-spin border-[#6315d9] border-t-transparent"
        />
      </div>
    );
  }

  if (!user) return <LandingPage />;

  return <Dashboard />;
}

