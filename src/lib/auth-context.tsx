"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function fetchProfile(userId: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        setProfile(data as unknown as Profile | null);
      } catch {
        setProfile(null);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: User } | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        setLoading(false);

        if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    // Fallback timeout - if onAuthStateChange doesn't fire in 5s, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.perfil === "admin",
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
