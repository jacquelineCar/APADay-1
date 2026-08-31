import { TYPE_LABELS, type InquiryType } from "./supabase";

/**
 * Confirmation email for a new enquiry.
 *
 * Deliberately best-effort. The lead is already saved by the time this
 * runs, so a Resend outage, a missing key, or an unverified domain must
 * never surface to the visitor or lose the enquiry — it logs and moves on.
 *
 * Returns what happened so callers can log it, never throws.
 */
export async function sendConfirmation(opts: {
  to: string;
  name: string;
  type: InquiryType;
  subject: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  // ---- Resend is OFF until the sending domain is verified. ----
  // Nothing is sent while EMAIL_ENABLED is anything other than "true".
  // Flip it in .env.local once austpayroll.com.au shows Verified in
  // Resend; no other code change is needed.
  if (process.env.EMAIL_ENABLED !== "true") {
    return { sent: false, reason: "email disabled (EMAIL_ENABLED is not true)" };
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM;

  if (!key || key.includes("YOUR_")) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  if (!from || from.includes("YOUR_")) {
    return { sent: false, reason: "RESEND_FROM_EMAIL / RESEND_FROM not set" };
  }

  const heading = TYPE_LABELS[opts.type] ?? opts.type;

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1f2733;max-width:560px">
      <p style="border-top:6px solid #48608A;padding-top:16px;margin:0 0 18px;
                font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#48608A">
        Australian Payroll Association
      </p>
      <h1 style="font-size:22px;margin:0 0 14px">We have your enquiry</h1>
      <p>Hello ${escapeHtml(opts.name)},</p>
      <p>
        Thanks for getting in touch. Your enquiry has been logged against your
        details, so it can't get lost or land in the wrong queue.
      </p>
      <p style="background:#f4f6f9;border-left:4px solid #F0BD18;padding:12px 16px;margin:18px 0">
        <strong>${escapeHtml(heading)}</strong>
        ${opts.subject ? `<br>${escapeHtml(opts.subject)}` : ""}
      </p>
      <p>
        If this is a help desk question and your membership is current, it is
        already in the Help Desk queue. We'll come back to you shortly.
      </p>
      <p style="color:#5a6675;font-size:13px;border-top:1px solid #d8dee7;padding-top:14px;margin-top:24px">
        Australian Payroll Association — membership and training for payroll
        professionals. Please don't reply to this address.
      </p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: "We have your enquiry — Australian Payroll Association",
        html,
      }),
    });

    if (!res.ok) {
      return { sent: false, reason: `Resend ${res.status}: ${await res.text()}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
