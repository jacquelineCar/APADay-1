import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { money, when } from "@/lib/crm";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  product_name: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  people: { id: string; name: string | null; email: string } | null;
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  let failure: string | null = null;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, product_name, amount_cents, currency, status, created_at, people ( id, name, email )",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    orders = (data ?? []) as unknown as Order[];
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e);
  }

  // Only money actually collected counts toward the total.
  const paid = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  return (
    <main className="wrap">
      <div className="pagehead">
        <h2>Orders</h2>
        <p className="sub">
          {failure
            ? "not connected"
            : `${orders.length} ${orders.length === 1 ? "order" : "orders"} · ${money(paid)} paid`}
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

      {!failure && orders.length === 0 && (
        <div className="empty">
          <p style={{ margin: 0 }}>
            No orders yet. Add one from a person&apos;s record.
          </p>
        </div>
      )}

      {orders.map((o) => (
        <article className="lead" key={o.id}>
          <div className="lead-head">
            <span className="badge status">{o.status}</span>
            <span className="when">{when(o.created_at)}</span>
          </div>
          <p className="who">
            {o.people ? (
              <Link href={`/admin/people/${o.people.id}`}>
                {o.people.name ?? o.people.email}
              </Link>
            ) : (
              "Unknown person"
            )}
          </p>
          <p className="subject">
            {o.product_name} — {money(o.amount_cents, o.currency)}
          </p>
        </article>
      ))}
    </main>
  );
}
