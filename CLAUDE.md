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
- Build 1 (small) status: [blocked — code complete, database not created]
  Written, typechecked, built, and raised as PR #1. Three things are
  outstanding, none of them code:
    1. Apply supabase/migrations/0001_apa_crm_build1.sql to the APA
       project. There is no table in it yet, so nothing can be saved.
    2. Replace NEXT_PUBLIC_SUPABASE_ANON_KEY and
       SUPABASE_SERVICE_ROLE_KEY in Vercel — both are YOUR_...
       placeholders, which is why the live admin page says
       "not connected".
    3. Merge PR #1 to deploy.
- Admin account seeded: [done] jacqueline@austpayroll.com.au
  Created in Supabase Auth, email pre-confirmed, and sign-in verified
  against the live auth endpoint — a real session was issued. The
  temporary password was handed over in chat and should be changed.
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
