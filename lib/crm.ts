/** The pipeline, in the order a lead actually moves through it. */
export const STATUSES = [
  "new_lead",
  "contacted",
  "discovery_call",
  "proposal",
  "won",
  "lost",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  new_lead: "New lead",
  contacted: "Contacted",
  discovery_call: "Discovery call",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The four APA custom attributes, in the order they should be read. */
export const ATTR_LABELS: Array<[string, string]> = [
  ["membership_number", "Membership"],
  ["industry", "Industry"],
  ["state", "State"],
  ["modern_award", "Modern award"],
];

export function money(cents: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function when(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  });
}

/** How long ago, in the shortest form that is still honest. */
export function age(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Milliseconds since an ISO timestamp. */
export function ageMs(iso: string, now = Date.now()): number {
  return now - new Date(iso).getTime();
}

/**
 * The help desk promise from the plan: a member question should be picked
 * up within two hours. Anything past that is the failure the whole system
 * exists to prevent, so the dashboard calls it out by name.
 */
export const HELPDESK_SLA_MS = 2 * 60 * 60 * 1000;
