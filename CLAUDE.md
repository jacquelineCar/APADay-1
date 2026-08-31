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
- Build 1 (small) status: [verified end to end, not yet live]
  The whole loop was run against the real APA database and passes:
    - people + contacts created; every column matches the plan
    - constraints genuinely enforce: the three inquiry types, the six
      pipeline statuses, the eight state codes, unique email
    - RLS on with no policies — the browser key can neither read nor
      write; only server code with the service key gets through
    - a form submit writes one person + one contact at new_lead
    - a second submit from the same email (uppercase) produced one
      person and two contacts; industry and modern_award were preserved
      rather than overwritten by the sparser second submission
    - /admin/leads redirects to /admin/login when signed out and leaks
      no lead data; signing in with the seeded account works; the page
      lists both enquiries newest first with all four attributes;
      sign out re-locks it
  Remaining, and neither is code: the two Vercel keys are still
  YOUR_... placeholders, and PR #1 is unmerged. Until both are done
  this is verified on localhost only, never on the live URL.
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
