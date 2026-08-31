import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { updateStatus } from "../crm-actions";
import { ResultBanner } from "../result-banner";
import {
  STATUSES,
  STATUS_LABELS,
  ATTR_LABELS,
  when,
  type Status,
} from "@/lib/crm";

// The queue must always be fresh — never serve a cached lead list.
export const dynamic = "force-dynamic";

type Person = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  role: string | null;
  attributes: Record<string, string> | null;
};

type Lead = {
  id: string;
  type: string;
  subject: string | null;
  message: string | null;
  status: Status;
  created_at: string;
  people: Person | null;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    moved?: string;
    err?: string;
  }>;
}) {
  const params = await searchParams;
  const filter = STATUSES.includes(params.status as Status)
    ? (params.status as Status)
    : null;

  // Come back to the same filtered view the move was made from.
  const back = filter ? `/admin/leads?status=${filter}` : "/admin/leads";

  let leads: Lead[] = [];
  let failure: string | null = null;

  try {
    const supabase = supabaseAdmin();
    let q = supabase
      .from("contacts")
      .select(
        "id, type, subject, message, status, created_at, people ( id, name, email, phone, company, role, attributes )",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter) q = q.eq("status", filter);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    leads = (data ?? []) as unknown as Lead[];
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="wrap">
      <div className="pagehead">
        <h2>Enquiries</h2>
        <p className="sub">
          {failure
            ? "not connected"
            : `${leads.length} ${leads.length === 1 ? "enquiry" : "enquiries"}, newest first`}
        </p>
      </div>

      <ResultBanner moved={params.moved} err={params.err} />

      <nav className="filters">
        <Link className={!filter ? "on" : ""} href="/admin/leads">
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            className={filter === s ? "on" : ""}
            href={`/admin/leads?status=${s}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>

      {failure && (
        <div className="setup">
          <p>
            <strong>Not connected to Supabase.</strong>
          </p>
          <p>{failure}</p>
        </div>
      )}

      {!failure && leads.length === 0 && (
        <div className="empty">
          <p style={{ margin: 0 }}>
            {filter
              ? `Nothing at "${STATUS_LABELS[filter]}" right now.`
              : "No enquiries yet. Submit one from the public form and it will appear here within seconds."}
          </p>
        </div>
      )}

      {leads.map((lead) => {
        const person = lead.people;
        const attributes = person?.attributes ?? {};
        const present = ATTR_LABELS.filter(([key]) => attributes[key]);

        return (
          <article className="lead" key={lead.id}>
            <div className="lead-head">
              <span className={`badge ${lead.type}`}>{lead.type}</span>
              <span className="badge status">{STATUS_LABELS[lead.status]}</span>
              <span className="when">{when(lead.created_at)}</span>
            </div>

            <p className="who">
              {person ? (
                <Link href={`/admin/people/${person.id}`}>
                  {person.name ?? person.email}
                </Link>
              ) : (
                "Name not given"
              )}
            </p>
            <p className="contactline">
              {[person?.email, person?.phone, person?.company, person?.role]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {lead.subject && <p className="subject">{lead.subject}</p>}
            {lead.message && <p className="message">{lead.message}</p>}

            <ul className="attrs">
              {present.length === 0 && (
                <li className="none">No membership or award details given</li>
              )}
              {present.map(([key, label]) => (
                <li key={key}>
                  <span>{label}</span>
                  {attributes[key]}
                </li>
              ))}
            </ul>

            <form className="pipeline" action={updateStatus}>
              <input type="hidden" name="contact_id" value={lead.id} />
              <input type="hidden" name="back" value={back} />
              <label htmlFor={`to-${lead.id}`}>Move to</label>
              <select
                id={`to-${lead.id}`}
                name="to_status"
                defaultValue={lead.status}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                name="note"
                type="text"
                placeholder="Note (optional)"
                maxLength={300}
              />
              <button type="submit">Update</button>
            </form>
          </article>
        );
      })}
    </main>
  );
}
