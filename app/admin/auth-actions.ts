"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAuth } from "@/lib/auth";

/** Sign in with email and password. */
export async function signIn(form: FormData): Promise<void> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin/leads");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("sign-in failed", error.message);
    redirect("/admin/login?error=denied");
  }

  // Only ever redirect inside this site.
  const target = next.startsWith("/admin") ? next : "/admin/leads";
  revalidatePath(target);
  redirect(target);
}

/** Sign out and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/admin/login?signedout=1");
}
