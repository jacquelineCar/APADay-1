import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * The publishable (anon) key.
 *
 * Vercel has this as NEXT_PUBLIC_SUPABASE_ANON_KEY; local .env.local uses
 * Supabase's newer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY name. Accept either
 * so the same code runs in both places.
 */
export function publishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key || key.includes("YOUR_")) {
    throw new Error(
      "Supabase publishable key is missing. Set NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) from Project Settings → API.",
    );
  }
  return key;
}

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("YOUR_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing. Set it from Project Settings → API.",
    );
  }
  return url;
}

/**
 * Auth-aware Supabase client for server components and server actions.
 *
 * Uses the publishable key and the user's own session cookie — never the
 * service key. This is what decides whether someone is logged in.
 */
export async function supabaseAuth() {
  const store = await cookies();

  return createServerClient(supabaseUrl(), publishableKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in user, or null. */
export async function currentUser() {
  const supabase = await supabaseAuth();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
