import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client, using the service_role key.
 *
 * This must never be imported into a client component. The service key
 * bypasses Row Level Security, so it stays on the server, always.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = !url || !key;
  const stubbed =
    (url?.includes("YOUR_") ?? false) || (key?.includes("YOUR_") ?? false);

  if (missing || stubbed) {
    throw new Error(
      "Supabase is not configured yet. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the APA Supabase " +
        "project (Project Settings → API).",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The three APA inquiry types. Mirrors the contacts_type_valid constraint. */
export const INQUIRY_TYPES = ["helpdesk", "membership", "training"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

/** Australian states and territories. Mirrors the people_state_valid constraint. */
export const STATES = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
] as const;
export type State = (typeof STATES)[number];

export const TYPE_LABELS: Record<InquiryType, string> = {
  helpdesk: "Help Desk — a payroll question",
  membership: "Membership — joining, renewing, or checking status",
  training: "Training — courses and bookings",
};
