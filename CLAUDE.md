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
- Resend account: [confirm] — not needed until Build 2.

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
- Build 2 (all) status: [pending]
- Resend domain verified: [pending]

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
