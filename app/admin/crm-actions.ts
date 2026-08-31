"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { STATUSES, ORDER_STATUSES, type Status } from "@/lib/crm";

/** Append a result flag to a path that may already carry a query string. */
function withFlag(path: string, flag: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${flag}`;
}

/**
 * Only ever redirect to somewhere inside /admin. The return path arrives
 * from a form field, so it is treated as untrusted input.
 */
function safeBack(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/admin/") && !value.startsWith("//")
    ? value
    : "/admin/leads";
}

/**
 * Move one enquiry along the pipeline.
 *
 * Every accepted change writes exactly one activity_log row recording
 * where it came from, where it went, and who did it.
 *
 * The status update runs first and the history row second, so a logging
 * failure can never lose the status change. That ordering means the badge
 * moving is not by itself proof the history was written — so when the log
 * insert fails the operator is told, rather than it going only to a server
 * console nobody reads.
 */
export async function updateStatus(form: FormData): Promise<void> {
  const contactId = String(form.get("contact_id") ?? "");
  const to = String(form.get("to_status") ?? "") as Status;
  const note = String(form.get("note") ?? "").trim() || null;
  const back = safeBack(form.get("back"));

  if (!contactId || !STATUSES.includes(to)) {
    redirect(withFlag(back, "err=input"));
  }

  const user = await currentUser();
  if (!user) redirect("/admin/login"); // Middleware guards the route; this guards the action.

  const supabase = supabaseAdmin();

  const { data: existing, error: readErr } = await supabase
    .from("contacts")
    .select("id, status, person_id")
    .eq("id", contactId)
    .maybeSingle();

  if (readErr || !existing) {
    console.error("status change: contact not found", readErr);
    redirect(withFlag(back, "err=missing"));
  }

  // Nothing changed, so nothing to log. Keeps the history honest.
  if (existing.status === to) {
    redirect(withFlag(back, "err=nochange"));
  }

  const { error: updErr } = await supabase
    .from("contacts")
    .update({ status: to })
    .eq("id", contactId);

  if (updErr) {
    console.error("status change failed", updErr);
    redirect(withFlag(back, "err=save"));
  }

  const { error: logErr } = await supabase.from("activity_log").insert({
    contact_id: contactId,
    person_id: existing.person_id,
    from_status: existing.status,
    to_status: to,
    actor: user.email,
    note,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/people/${existing.person_id}`);

  // The move itself succeeded either way — say so plainly, and say loudly
  // when the history row did not land.
  if (logErr) {
    console.error("activity_log insert failed", logErr);
    redirect(withFlag(back, "err=log"));
  }

  redirect(withFlag(back, "moved=1"));
}

/** Record something a person bought. */
export async function addOrder(form: FormData): Promise<void> {
  const personId = String(form.get("person_id") ?? "");
  const productName = String(form.get("product_name") ?? "").trim();
  const amountRaw = String(form.get("amount") ?? "").trim();
  const status = String(form.get("status") ?? "pending");
  const back = `/admin/people/${personId}`;

  if (!personId || !productName) {
    redirect(withFlag(back, "err=input"));
  }
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    redirect(withFlag(back, "err=input"));
  }

  const user = await currentUser();
  if (!user) redirect("/admin/login");

  // The form takes dollars; the column stores cents.
  const dollars = Number(amountRaw);
  if (!Number.isFinite(dollars) || dollars < 0) {
    redirect(withFlag(back, "err=amount"));
  }
  const amountCents = Math.round(dollars * 100);

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("orders").insert({
    person_id: personId,
    product_name: productName,
    amount_cents: amountCents,
    currency: "AUD",
    status,
  });

  revalidatePath("/admin/orders");
  revalidatePath(back);

  if (error) {
    console.error("order insert failed", error);
    redirect(withFlag(back, "err=order"));
  }

  redirect(withFlag(back, "added=1"));
}
