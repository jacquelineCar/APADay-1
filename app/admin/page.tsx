import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { INQUIRY_TYPES, type InquiryType } from "@/lib/supabase";
import {
  STATUSES,
  STATUS_LABELS,
  HELPDESK_SLA_MS,
  age,
  ageMs,
  money,
  type Status,
} from "@/lib/crm";

// The queue is the point of this screen — never serve it from a cache.
export const dynamic = "force-dynamic";

const DAY = 86_400_000;

type Waiting = {
  id: string;
  type: string;
  subject: string | null;
  created_at: string;
  people: { id: string; name: string | null; email: string } | null;
};

type Dashboard = {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  waiting: Waiting[];
  overdue: number;
  openTotal: number;
  lastWeek: number;
  wonThisMonth: number;
  people: number;
  subscribers: number;
  paidCents: number;
  pendingOrders: number;
};

async function load(now: number): Promise<Dashboard> {
  const supabase = supabaseAdmin();

  const tally = async (
    table: string,
    apply?: (q: any) => any,
  ): Promise<number> => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    statusCounts,
    typeCounts,
    waitingRes,
    lastWeek,
    wonThisMonth,
    people,
    subscribers,
    paidRes,
    pendingOrders,
  ] = await Promise.all([
    Promise.all(STATUSES.map((s) => tally("contacts", (q) => q.eq("status", s)))),
    Promise.all(
      INQUIRY_TYPES.map((t) => tally("contacts", (q) => q.eq("type", t))),
    ),
    // The oldest untouched leads. Oldest first is deliberate: this is a
    // worklist, not a news feed.
    supabase
      .from("contacts")
      .select("id, type, subject, created_at, people ( id, name, email )")
      .eq("status", "new_lead")
      .order("created_at", { ascending: true })
      .limit(8),
    tally("contacts", (q) =>
      q.gte("created_at", new Date(now - 7 * DAY).toISOString()),
    ),
    tally("contacts", (q) =>
      q.eq("status", "won").gte("created_at", monthStart.toISOString()),
    ),
    tally("people"),
    tally("people", (q) => q.eq("ok_to_contact", true)),
    supabase.from("orders").select("amount_cents").eq("status", "paid"),
    tally("orders", (q) => q.eq("status", "pending")),
  ]);

  if (waitingRes.error) throw new Error(waitingRes.error.message);
  if (paidRes.error) throw new Error(paidRes.error.message);

  const byStatus = Object.fromEntries(
    STATUSES.map((s, i) => [s, statusCounts[i]]),
  );
  const byType = Object.fromEntries(
    INQUIRY_TYPES.map((t, i) => [t, typeCounts[i]]),
  );

  // Overdue is counted across every new lead, not just the eight shown.
  const { count: overdue } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("status", "new_lead")
    .eq("type", "helpdesk")
    .lt("created_at", new Date(now - HELPDESK_SLA_MS).toISOString());

  return {
    byStatus,
    byType,
    waiting: (waitingRes.data ?? []) as unknown as Waiting[],
    overdue: overdue ?? 0,
    openTotal:
      byStatus.new_lead +
      byStatus.contacted +
      byStatus.discovery_call +
      byStatus.proposal,
    lastWeek,
    wonThisMonth,
    people,
    subscribers,
    paidCents: (paidRes.data ?? []).reduce(
      (sum, o: { amount_cents: number }) => sum + o.amount_cents,
      0,
    ),
    pendingOrders,
  };
}

export default async function DashboardPage() {
  const now = Date.now();

  let d: Dashboard | null = null;
  let failure: string | null = null;
  try {
    d = await load(now);
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  if (failure || !d) {
    return (
      <main className="wrap">
        <div className="pagehead">
          <h2>Dashboard</h2>
          <p className="sub">not connected</p>
        </div>
        <div className="setup">
          <p>
            <strong>Not connected to Supabase.</strong>
          </p>
          <p>{failure}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="pagehead">
        <h2>Dashboard</h2>
        <p className="sub">
          {d.openTotal} open {d.openTotal === 1 ? "enquiry" : "enquiries"} ·{" "}
          {d.lastWeek} in the last 7 days
        </p>
      </div>

      {d.overdue > 0 && (
        <div className="banner bad" role="alert">
          <p>
            <strong>
              {d.overdue} help desk{" "}
              {d.overdue === 1 ? "enquiry has" : "enquiries have"} been waiting
              over two hours.
            </strong>
            This is the gap the system exists to close — a member question
            sitting unclaimed.{" "}
            <Link href="/admin/leads?status=new_lead">Work the queue →</Link>
          </p>
        </div>
      )}

      {/* Every tile is a link. A number you can't act on is decoration. */}
      <div className="tiles">
        <Link className="tile" href="/admin/leads?status=new_lead">
          <span className={`n ${d.byStatus.new_lead > 0 ? "hot" : ""}`}>
            {d.byStatus.new_lead}
          </span>
          <span className="lbl">New, untouched</span>
        </Link>
        <Link className="tile" href="/admin/leads">
          <span className="n">{d.openTotal}</span>
          <span className="lbl">Open in pipeline</span>
        </Link>
        <Link className="tile" href="/admin/leads?status=won">
          <span className="n">{d.wonThisMonth}</span>
          <span className="lbl">Won this month</span>
        </Link>
        <Link className="tile" href="/admin/orders">
          <span className="n">{money(d.paidCents)}</span>
          <span className="lbl">Collected</span>
        </Link>
      </div>

      <section className="panel">
        <h3>Waiting longest</h3>
        {d.waiting.length === 0 && (
          <p className="none">
            Nothing untouched. Every enquiry has been picked up.
          </p>
        )}
        {d.waiting.map((c) => {
          const late =
            c.type === "helpdesk" && ageMs(c.created_at, now) > HELPDESK_SLA_MS;
          return (
            <div className="row-item" key={c.id}>
              <div className="lead-head">
                <span className={`badge ${c.type}`}>{c.type}</span>
                <span className={`badge ageflag ${late ? "late" : ""}`}>
                  {age(c.created_at, now)}
                  {late ? " · over SLA" : ""}
                </span>
                <span className="when">
                  {c.people ? (
                    <Link href={`/admin/people/${c.people.id}`}>
                      {c.people.name ?? c.people.email}
                    </Link>
                  ) : (
                    "Name not given"
                  )}
                </span>
              </div>
              {c.subject && <p className="subject">{c.subject}</p>}
            </div>
          );
        })}
        {d.byStatus.new_lead > d.waiting.length && (
          <p className="none">
            <Link href="/admin/leads?status=new_lead">
              {d.byStatus.new_lead - d.waiting.length} more waiting →
            </Link>
          </p>
        )}
      </section>

      <section className="panel">
        <h3>Pipeline</h3>
        <div className="pipe-strip">
          {STATUSES.map((s) => (
            <Link
              className="step"
              key={s}
              href={`/admin/leads?status=${s}`}
              aria-label={`${d.byStatus[s]} at ${STATUS_LABELS[s]}`}
            >
              <span className="n">{d.byStatus[s]}</span>
              <span className="lbl">{STATUS_LABELS[s]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Where enquiries come from</h3>
        <div className="pipe-strip">
          {INQUIRY_TYPES.map((t) => (
            <Link className="step" key={t} href={`/admin/leads?type=${t}`}>
              <span className="n">{d.byType[t]}</span>
              <span className="lbl">{t}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Lists</h3>
        <ul className="attrs">
          <li>
            <span>People</span>
            <Link href="/admin/people">{d.people}</Link>
          </li>
          <li>
            <span>Newsletter</span>
            <Link href="/admin/newsletter">{d.subscribers}</Link>
          </li>
          <li>
            <span>Orders pending</span>
            <Link href="/admin/orders">{d.pendingOrders}</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
