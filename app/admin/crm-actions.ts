"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { STATUSES, ORDER_STATUSES, type Status } from "@/lib/crm";

/**
 * Move one enquiry along the pipeline.
 *
 * Every accepted change writes exactly one activity_log row recording
 * where it came from, where it went, and who did it.
 */
export async function updateStatus(form: FormData): Promise<void> {
  const contactId = String(form.get("contact_id") ?? "");
  const to = String(form.get("to_status") ?? "") as Status;
  const note = String(form.get("note") ?? "").trim() || null;

  if (!contactId || !STATUSES.includes(to)) return;

  const user = await currentUser();
  if (!user) return; // Middleware guards the route; this guards the action.

  const supabase = supabaseAdmin();

  const { data: existing, error: readErr } = await supabase
    .from("contacts")
    .select("id, status, person_id")
    .eq("id", contactId)
    .maybeSingle();

  if (readErr || !existing) {
    console.error("status change: contact not found", readErr);
    return;
  }

  // Nothing changed, so nothing to log. Keeps the history honest.
  if (existing.status === to) return;

  const { error: updErr } = await supabase
    .from("contacts")
    .update({ status: to })
    .eq("id", contactId);

  if (updErr) {
    console.error("status change failed", updErr);
    return;
  }

  const { error: logErr } = await supabase.from("activity_log").insert({
    contact_id: contactId,
    person_id: existing.person_id,
    from_status: existing.status,
    to_status: to,
    actor: user.email,
    note,
  });

  if (logErr) console.error("activity_log insert failed", logErr);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/people/${existing.person_id}`);
}

/** Record something a person bought. */
export async function addOrder(form: FormData): Promise<void> {
  const personId = String(form.get("person_id") ?? "");
  const productName = String(form.get("product_name") ?? "").trim();
  const amountRaw = String(form.get("amount") ?? "").trim();
  const status = String(form.get("status") ?? "pending");

  if (!personId || !productName) return;
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  const user = await currentUser();
  if (!user) return;

  // The form takes dollars; the column stores cents.
  const dollars = Number(amountRaw);
  if (!Number.isFinite(dollars) || dollars < 0) return;
  const amountCents = Math.round(dollars * 100);

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("orders").insert({
    person_id: personId,
    product_name: productName,
    amount_cents: amountCents,
    currency: "AUD",
    status,
  });

  if (error) console.error("order insert failed", error);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/people/${personId}`);
}
