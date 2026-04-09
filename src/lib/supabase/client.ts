import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getPublicSupabaseConfig } from "@/lib/env";

let client: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> | null {
  if (client) return client;

  const config = getPublicSupabaseConfig();
  if (!config) {
    return null;
  }

  client = createBrowserClient<Database>(config.url, config.anonKey);
  return client;
}
