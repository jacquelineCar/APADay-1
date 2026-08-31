import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { when } from "@/lib/crm";

export const dynamic = "force-dynamic";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  created_at: string;
};

export default async function NewsletterPage() {
  let subscribers: Subscriber[] = [];
  let failure: string | null = null;

  try {
    const supabase = supabaseAdmin();
    // The newsletter is not a table — it is everyone who opted in.
    const { data, error } = await supabase
      .from("people")
      .select("id, email, name, company, created_at")
      .eq("ok_to_contact", true)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    subscribers = (data ?? []) as Subscriber[];
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="wrap">
      <div className="pagehead">
        <h2>Newsletter</h2>
        <p className="sub">
          {failure
            ? "not connected"
            : `${subscribers.length} opted in (people.ok_to_contact = true)`}
        </p>
      </div>

      {failure && (
        <div className="setup">
          <p>
            <strong>Not connected to Supabase.</strong>
          </p>
          <p>{failure}</p>
        </div>
      )}

      {!failure && subscribers.length === 0 && (
        <div className="empty">
          <p style={{ margin: 0 }}>
            Nobody has opted in yet. The tick box on the public form sets this.
          </p>
        </div>
      )}

      {subscribers.length > 0 && (
        <table className="listing">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Organisation</th>
              <th>Opted in</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/people/${s.id}`}>{s.name ?? "—"}</Link>
                </td>
                <td>{s.email}</td>
                <td>{s.company ?? "—"}</td>
                <td>{when(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
