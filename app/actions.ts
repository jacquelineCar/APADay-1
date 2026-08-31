"use server";

import { redirect } from "next/navigation";
import {
  supabaseAdmin,
  INQUIRY_TYPES,
  STATES,
  type InquiryType,
} from "@/lib/supabase";

const SOURCE = "apahelpdesk.com.au — website form";

function text(form: FormData, key: string): string | null {
  const raw = form.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Handles one inquiry from the public form.
 *
 * Upserts the person by email — never a duplicate — then writes a linked
 * Contacts row in status new_lead.
 */
export async function submitInquiry(form: FormData): Promise<void> {
  const email = text(form, "email")?.toLowerCase() ?? null;
  const name = text(form, "name");
  const typeRaw = text(form, "type");
  const message = text(form, "message");

  if (!email || !email.includes("@")) {
    redirect("/?error=email");
  }
  if (!name) {
    redirect("/?error=name");
  }
  if (!typeRaw || !INQUIRY_TYPES.includes(typeRaw as InquiryType)) {
    redirect("/?error=type");
  }
  if (!message) {
    redirect("/?error=message");
  }

  const type = typeRaw as InquiryType;

  const stateRaw = text(form, "state");
  if (stateRaw && !STATES.includes(stateRaw as (typeof STATES)[number])) {
    redirect("/?error=state");
  }

  // The four APA custom attributes. Only keys with a value are stored.
  const incomingAttributes: Record<string, string> = {};
  const membershipNumber = text(form, "membership_number");
  const industry = text(form, "industry");
  const modernAward = text(form, "modern_award");
  if (membershipNumber) incomingAttributes.membership_number = membershipNumber;
  if (industry) incomingAttributes.industry = industry;
  if (stateRaw) incomingAttributes.state = stateRaw;
  if (modernAward) incomingAttributes.modern_award = modernAward;

  // If Supabase isn't configured, or is unreachable, the visitor gets the
  // "please try again" banner — never a raw server exception page.
  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (e) {
    console.error("supabase not configured", e);
    redirect("/?error=server");
  }

  // ---- Person: find, then merge-update or insert. Never duplicate. ----
  const { data: existing, error: lookupError } = await supabase
    .from("people")
    .select("id, attributes")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("people lookup failed", lookupError);
    redirect("/?error=server");
  }

  const fields = {
    name,
    phone: text(form, "phone"),
    company: text(form, "company"),
    role: text(form, "role"),
  };

  let personId: string;

  if (existing) {
    // Merge attributes so a sparse resubmission never wipes what we know.
    const merged = {
      ...((existing.attributes as Record<string, string> | null) ?? {}),
      ...incomingAttributes,
    };

    // Only overwrite a field when this submission actually supplied it.
    const patch: Record<string, unknown> = { attributes: merged };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null) patch[key] = value;
    }
    if (form.get("ok_to_contact") !== null) patch.ok_to_contact = true;

    const { error } = await supabase
      .from("people")
      .update(patch)
      .eq("id", existing.id);

    if (error) {
      console.error("people update failed", error);
      redirect("/?error=server");
    }
    personId = existing.id as string;
  } else {
    const { data, error } = await supabase
      .from("people")
      .insert({
        email,
        ...fields,
        source_site: SOURCE,
        ok_to_contact: form.get("ok_to_contact") !== null,
        attributes: incomingAttributes,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("people insert failed", error);
      redirect("/?error=server");
    }
    personId = data.id as string;
  }

  // ---- Contact: one inquiry, always starting at new_lead ----
  const { error: contactError } = await supabase.from("contacts").insert({
    person_id: personId,
    type,
    subject: text(form, "subject"),
    message,
    source: SOURCE,
    status: "new_lead",
  });

  if (contactError) {
    console.error("contacts insert failed", contactError);
    redirect("/?error=server");
  }

  redirect("/?sent=1");
}
