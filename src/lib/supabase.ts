import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const AUTH_READY_TIMEOUT_MS = 7000;

export const missingSupabaseEnvVars = [
  !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
  !supabaseKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
].filter((v): v is string => Boolean(v));

export function isSupabaseConfigured() {
  return missingSupabaseEnvVars.length === 0;
}

// Mantem o app funcional no build mesmo sem env.
const safeSupabaseUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeSupabaseKey = supabaseKey || "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(safeSupabaseUrl, safeSupabaseKey);

let authReadyPromise: Promise<void> | null = null;

function getSupabaseConfigErrorMessage() {
  return "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local e no deploy.";
}

async function waitWithTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return await Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Tempo limite ao inicializar autenticacao do Supabase."));
      }, timeoutMs);
    }),
  ]);
}

export async function ensureSupabaseAuthReady() {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  if (!authReadyPromise) {
    authReadyPromise = waitWithTimeout(
      supabase.auth.getSession().then(() => undefined),
      AUTH_READY_TIMEOUT_MS
    ).catch((error) => {
      authReadyPromise = null;
      throw error;
    });
  }

  await authReadyPromise;
}

export function requireSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigErrorMessage());
  }
}

// Aliases para manter compatibilidade entre telas.
export const ensureSupabaseSession = ensureSupabaseAuthReady;
export const runSupabaseAuthInit = ensureSupabaseAuthReady;

export async function supabaseReady() {
  try {
    await ensureSupabaseAuthReady();
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao inicializar Supabase.";
    return message;
  }
}
