/**
 * The outcome of a pipeline move or an added order, said out loud.
 *
 * A CRM that fails quietly is worse than one that fails — the operator
 * carries on believing the history is there. Every server action in
 * crm-actions.ts redirects back with one of these flags.
 */
const MESSAGES: Record<string, { tone: "ok" | "bad"; title: string; detail: string }> = {
  "moved=1": {
    tone: "ok",
    title: "Enquiry moved",
    detail: "The new stage is saved and one history row was written.",
  },
  "added=1": {
    tone: "ok",
    title: "Order added",
    detail: "It now shows on this person's record and in Orders.",
  },
  "err=log": {
    tone: "bad",
    title: "Moved, but the history row failed",
    detail:
      "The stage change is saved. Writing the activity_log row did not " +
      "work, so this move is missing from the history. Check that the " +
      "Build 2 migration has been applied.",
  },
  "err=save": {
    tone: "bad",
    title: "The stage change did not save",
    detail: "Nothing was changed. Try again.",
  },
  "err=missing": {
    tone: "bad",
    title: "That enquiry could not be found",
    detail: "It may have been deleted. Reload the list.",
  },
  "err=nochange": {
    tone: "bad",
    title: "Already at that stage",
    detail: "Nothing was changed, so no history row was written.",
  },
  "err=input": {
    tone: "bad",
    title: "That did not look right",
    detail: "Some required detail was missing. Nothing was saved.",
  },
  "err=amount": {
    tone: "bad",
    title: "That amount did not look right",
    detail: "Enter the amount in dollars, for example 249.00. Nothing was saved.",
  },
  "err=order": {
    tone: "bad",
    title: "The order did not save",
    detail:
      "Nothing was recorded. Check that the Build 2 migration has been applied.",
  },
};

export function ResultBanner({
  moved,
  added,
  err,
}: {
  moved?: string;
  added?: string;
  err?: string;
}) {
  const key = err ? `err=${err}` : moved ? "moved=1" : added ? "added=1" : null;
  const message = key ? MESSAGES[key] : null;
  if (!message) return null;

  return (
    <div className={`banner ${message.tone}`} role="status">
      <p>
        <strong>{message.title}</strong>
        {message.detail}
      </p>
    </div>
  );
}
