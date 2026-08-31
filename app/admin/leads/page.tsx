import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { signOut } from "../auth-actions";

// Leads must always be fresh — never serve a cached queue.
export const dynamic = "force-dynamic";

type Person = {
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
  status: string;
  created_at: string;
  people: Person | null;
};

const ATTR_LABELS: Array<[string, string]> = [
  ["membership_number", "Membership"],
  ["industry", "Industry"],
  ["state", "State"],
  ["modern_award", "Modern award"],
];

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  });
}

export default async function LeadsPage() {
  const user = await currentUser();
  let leads: Lead[] = [];
  let failure: string | null = null;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("contacts")
      .select(
        "id, type, subject, message, status, created_at, people ( name, email, phone, company, role, attributes )",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    leads = (data ?? []) as unknown as Lead[];
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  return (
    <>
      <div className="adminbar">
        <div className="wrap">
          <div className="title">
            <span className="org">APA</span> — Leads
          </div>
          <div className="count">
            {failure
              ? "not connected"
              : `${leads.length} ${leads.length === 1 ? "enquiry" : "enquiries"}, newest first`}
          </div>
          <form className="signout" action={signOut}>
            <span className="who-in">{user?.email}</span>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>

      <main className="wrap">
        {failure && (
          <div className="setup">
            <p>
              <strong>Not connected to Supabase yet.</strong>
            </p>
            <p>{failure}</p>
            <p style={{ marginBottom: 0 }}>
              Once <code>.env.local</code> has the real APA project keys and the
              migration in <code>supabase/migrations/</code> has been applied,
              this page will list every enquiry as it arrives.
            </p>
          </div>
        )}

        {!failure && leads.length === 0 && (
          <div className="empty">
            <p style={{ margin: 0 }}>
              No enquiries yet. Submit one from the public form and it will appear
              here within seconds.
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
                <span className="badge status">{lead.status}</span>
                <span className="when">{when(lead.created_at)}</span>
              </div>

              <p className="who">{person?.name ?? "Name not given"}</p>
              <p className="contactline">
                {[
                  person?.email,
                  person?.phone,
                  person?.company,
                  person?.role,
                ]
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
            </article>
          );
        })}
      </main>
    </>
  );
}
