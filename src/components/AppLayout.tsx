"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import SupabaseConfigNotice from "./SupabaseConfigNotice";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, supabaseConfigured, missingSupabaseVars } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && supabaseConfigured && !user) {
      router.push("/login");
    }
  }, [user, loading, router, supabaseConfigured]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <main className="md:ml-64 p-6 pt-16 md:pt-6 space-y-4">
          <SupabaseConfigNotice
            title="Supabase não configurado"
            missingVars={missingSupabaseVars}
          />
          {children}
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
