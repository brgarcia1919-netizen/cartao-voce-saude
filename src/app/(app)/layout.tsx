"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";
import AppLayout from "@/components/AppLayout";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppLayout>{children}</AppLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
