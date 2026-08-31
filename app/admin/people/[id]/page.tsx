import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { addOrder } from "../../crm-actions";
import { ResultBanner } from "../../result-banner";
import {
  ATTR_LABELS,
  ORDER_STATUSES,
  STATUS_LABELS,
  money,
  when,
  type Status,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; err?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  const supabase = supabaseAdmin();

  const { data: person } = await supabase
    .from("people")
    .select(
      "id, email, name, phone, company, role, source_site, ok_to_contact, attributes, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!person) notFound();

  // Their whole story, in one place: enquiries, what changed, what they bought.
  const [{ data: contacts }, { data: orders }, { data: activity }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id, type, subject, message, status, created_at")
        .eq("person_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, product_name, amount_cents, currency, status, created_at")
        .eq("person_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("id, from_status, to_status, actor, note, created_at")
        .eq("person_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const attributes = (person.attributes ?? {}) as Record<string, string>;
  const present = ATTR_LABELS.filter(([key]) => attributes[key]);

  return (
    <main className="wrap">
      <p className="crumb">
        <Link href="/admin/people">← People</Link>
      </p>

      <div className="pagehead">
        <h2>{person.name ?? person.email}</h2>
        <p className="sub">
          {[person.email, person.phone, person.company, person.role]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <ResultBanner added={flags.added} err={flags.err} />

      <section className="panel">
        <h3>Details</h3>
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
          <li>
            <span>Newsletter</span>
            {person.ok_to_contact ? "Yes" : "No"}
          </li>
          <li>
            <span>First seen</span>
            {when(person.created_at)}
          </li>
        </ul>
      </section>

      <section className="panel">
        <h3>Enquiries ({contacts?.length ?? 0})</h3>
        {!contacts?.length && <p className="none">No enquiries.</p>}
        {contacts?.map((c) => (
          <div className="row-item" key={c.id}>
            <div className="lead-head">
              <span className={`badge ${c.type}`}>{c.type}</span>
              <span className="badge status">
                {STATUS_LABELS[c.status as Status] ?? c.status}
              </span>
              <span className="when">{when(c.created_at)}</span>
            </div>
            {c.subject && <p className="subject">{c.subject}</p>}
            {c.message && <p className="message">{c.message}</p>}
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Orders ({orders?.length ?? 0})</h3>
        {!orders?.length && <p className="none">Nothing bought yet.</p>}
        {orders?.map((o) => (
          <div className="row-item" key={o.id}>
            <div className="lead-head">
              <span className="badge status">{o.status}</span>
              <span className="when">{when(o.created_at)}</span>
            </div>
            <p className="subject">
              {o.product_name} — {money(o.amount_cents, o.currency)}
            </p>
          </div>
        ))}

        <form className="pipeline addorder" action={addOrder}>
          <input type="hidden" name="person_id" value={person.id} />
          <input
            name="product_name"
            type="text"
            placeholder="What they bought"
            maxLength={200}
            required
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount (AUD)"
            required
          />
          <select name="status" defaultValue="pending">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit">Add order</button>
        </form>
      </section>

      <section className="panel">
        <h3>History ({activity?.length ?? 0})</h3>
        {!activity?.length && (
          <p className="none">No status changes recorded yet.</p>
        )}
        {activity?.map((a) => (
          <div className="row-item" key={a.id}>
            <p className="subject">
              {a.from_status
                ? `${STATUS_LABELS[a.from_status as Status] ?? a.from_status} → `
                : ""}
              {STATUS_LABELS[a.to_status as Status] ?? a.to_status}
            </p>
            <p className="contactline">
              {[a.actor, when(a.created_at)].filter(Boolean).join(" · ")}
            </p>
            {a.note && <p className="message">{a.note}</p>}
          </div>
        ))}
      </section>
    </main>
  );
}
