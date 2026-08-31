import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ATTR_LABELS, when } from "@/lib/crm";

export const dynamic = "force-dynamic";

type Person = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  ok_to_contact: boolean;
  attributes: Record<string, string> | null;
  created_at: string;
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  let people: Person[] = [];
  let failure: string | null = null;

  try {
    const supabase = supabaseAdmin();
    let query = supabase
      .from("people")
      .select(
        "id, email, name, phone, company, role, ok_to_contact, attributes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (q) {
      // Search the name, email and company, plus the membership number
      // and award inside attributes — the things you'd actually type.
      const like = `%${q}%`;
      query = query.or(
        [
          `name.ilike.${like}`,
          `email.ilike.${like}`,
          `company.ilike.${like}`,
          `attributes->>membership_number.ilike.${like}`,
          `attributes->>modern_award.ilike.${like}`,
          `attributes->>industry.ilike.${like}`,
        ].join(","),
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    people = (data ?? []) as Person[];
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="wrap">
      <div className="pagehead">
        <h2>People</h2>
        <p className="sub">
          {failure
            ? "not connected"
            : `${people.length} ${people.length === 1 ? "person" : "people"}${q ? ` matching "${q}"` : ""}`}
        </p>
      </div>

      <form className="search" action="/admin/people">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search name, email, organisation, membership number, award…"
          aria-label="Search people"
        />
        <button type="submit">Search</button>
        {q && (
          <Link className="clear" href="/admin/people">
            Clear
          </Link>
        )}
      </form>

      {failure && (
        <div className="setup">
          <p>
            <strong>Not connected to Supabase.</strong>
          </p>
          <p>{failure}</p>
        </div>
      )}

      {!failure && people.length === 0 && (
        <div className="empty">
          <p style={{ margin: 0 }}>
            {q ? "Nobody matches that search." : "No people yet."}
          </p>
        </div>
      )}

      {people.map((p) => {
        const attributes = p.attributes ?? {};
        const present = ATTR_LABELS.filter(([key]) => attributes[key]);
        return (
          <article className="lead" key={p.id}>
            <p className="who">
              <Link href={`/admin/people/${p.id}`}>{p.name ?? p.email}</Link>
              {p.ok_to_contact && <span className="badge news">newsletter</span>}
            </p>
            <p className="contactline">
              {[p.email, p.phone, p.company, p.role].filter(Boolean).join(" · ")}
            </p>
            <ul className="attrs">
              {present.length === 0 && (
                <li className="none">No membership or award details</li>
              )}
              {present.map(([key, label]) => (
                <li key={key}>
                  <span>{label}</span>
                  {attributes[key]}
                </li>
              ))}
            </ul>
            <p className="when">Added {when(p.created_at)}</p>
          </article>
        );
      })}
    </main>
  );
}
