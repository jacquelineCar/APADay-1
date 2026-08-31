# Project Catalog

## Stack (already installed and wired — record the values)
- GitHub repo: jacquelineCar/APADay-1 (public, default branch main)
- Vercel project: apa-day-1 (team apa10) — https://apa-day-1.vercel.app
- Domain: www.apahelpdesk.com.au — NOT REGISTERED. No DNS record exists
  and Vercel has 0 domains on the team. Build 1 is running on the
  vercel.app URL above until this is bought and pointed at Vercel.
- Supabase project: nzhoquaiuejhkpdyhegw
  WARNING: the Supabase MCP connection is pointed at zojfkaggnkflnjhwmdey,
  which belongs to il-testdrive, not APA. Repoint it in ~/.claude.json
  (mcpServers.supabase.url, the project_ref query param) before asking
  Claude to touch the database.
- Supabase URL: https://nzhoquaiuejhkpdyhegw.supabase.co
- Supabase service key: in .env.local locally. In Vercel it is still a
  YOUR_... placeholder and must be replaced.
- Resend account: ✅ active. The API key in .env.local authenticates
  against the Resend API. The SENDING DOMAIN is a separate thing and is
  NOT verified — see the Build section below before wiring any email.

## Build (filled as we go)
- Plan written: [done]
- Build 1 (small) status: ✅ verified on the live site 31 Aug 2026
  Live at https://apa-day-1.vercel.app (NOT the custom domain — see the
  Domain line above; apahelpdesk.com.au is still unregistered).
  Run against production, not localhost:
    - submitted as a stranger; got the thank-you banner
    - one people row + one linked contacts row at status new_lead
    - all four attributes stored: membership_number, industry, state,
      modern_award
    - resubmitted from the same email in uppercase: one person, two
      contacts. industry and modern_award survived the sparser second
      submission instead of being overwritten
    - /admin/leads redirects to /admin/login when signed out, leaking
      no lead data; signed in; both enquiries listed newest first with
      every attribute readable; sign out re-locks it
  Test rows were deleted afterwards; both tables are empty.
  Still open: PR #2 (turns a raw exception page into a readable message
  when keys are missing). Not required, worth merging.
- Admin account seeded: ✅ jacqueline@austpayroll.com.au
  Created in Supabase Auth, email pre-confirmed, and used to sign in on
  the live site. Temporary password was handed over in chat — change it.
- Build 2 (all) status: ✅ built and verified 31 Aug 2026 — EXCEPT email.
  Verified on localhost:3000 against the PRODUCTION Supabase project
  (nzhoquaiuejhkpdyhegw). NOT deployed: the code is on branch build-2-crm,
  PR #4. /admin on the live vercel.app site is still Build 1.
    - migration 0002 applied by hand in the SQL editor; orders and
      activity_log now exist. Confirmed the project ref first — running it
      in il-testdrive would have succeeded silently in the wrong database.
    - submitted as a stranger: one people row, one linked contacts row at
      new_lead, all four attributes stored, newsletter opt-in captured
    - ran one lead the whole way: new_lead → contacted → discovery_call →
      proposal → won. Four activity_log rows, each from_status matching the
      previous to_status, actor = jacqueline@austpayroll.com.au, notes kept
    - added an order: $495.00 stored as 49500 cents, visible on the person
      record and in Orders ("1 order · $495.00 paid" — only paid counts)
    - person record shows details, enquiries, orders and history together
    - People search finds a person by membership_number inside the jsonb
    - Newsletter lists only ok_to_contact = true
    - all six /admin routes 307 to /admin/login when signed out
  Test rows deleted afterwards; the cascade removed the order and history.
  One row deliberately left: test@test.com, submitted by hand during the
  build. Delete it whenever you like.
  Two fixes made while verifying:
    - app/admin/layout.tsx called currentUser() unguarded, so a missing
      Supabase key made /admin/login 500 instead of showing its own
      "not configured" banner. It now fails to "nobody is signed in".
      This matters because the Vercel service key is still a placeholder.
    - updateStatus wrote the status first and the activity_log row second,
      swallowing log failures — the badge moved while nothing was recorded.
      Ordering kept; every outcome now redirects back with a banner,
      including "Moved, but the history row failed".
- Resend domain verified: ❌ NO. Do not mark this done until it is.
  Checked against the Resend API 31 Aug 2026: the account holds exactly one
  domain, austpayroll.com.au, at status "not_started" — its DNS records have
  never been added. apahelpdesk.com.au is not in Resend and is not even
  registered (no nameservers resolve).
  Decision 31 Aug 2026: send from austpayroll.com.au, whose DNS is on
  Cloudflare; add apahelpdesk.com.au as a second domain once bought. This
  deviates from the plan DoD, which names apahelpdesk.com.au.
  Three records to add in Cloudflare, then press Verify in Resend:
    TXT  resend._domainkey  (the DKIM p=... value from the Resend dashboard)
    MX   send               feedback-smtp.ap-northeast-1.amazonses.com, pri 10
    TXT  send               v=spf1 include:amazonses.com ~all
  Until then outbound email is OFF behind EMAIL_ENABLED, which must be
  exactly "true" before anything sends. lib/email.ts is written and ready;
  the owner-notification email (RESEND_NOTIFY_TO) is not built yet.

# How to use this catalog

You are my engineering partner. Before any task or /goal command:
1. Read this entire CLAUDE.md AND Working Files/product-plan.md.
2. Identify which catalog + plan items the task requires.
3. If any required item is [pending] or empty, STOP and tell me what to
   fill in. Use plain English: "I need X to do this. Please Y."
4. Don't proceed until every required item is filled.
5. After the task succeeds, update the catalog with new state.

Required items by task:
- /goal build 1 (small) → product-plan.md complete
- /goal build 2 (all) → product-plan.md + Build 1 complete + Resend domain verified
- Any deploy → GitHub + Vercel + Domain confirmed
