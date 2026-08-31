import { submitInquiry } from "./actions";
import { INQUIRY_TYPES, STATES, TYPE_LABELS } from "@/lib/supabase";

const ERRORS: Record<string, string> = {
  email: "That email address doesn't look right. Please check it and try again.",
  name: "Please tell us your name.",
  type: "Please choose what your enquiry is about.",
  message: "Please tell us what you need help with.",
  state: "Please choose a state or territory from the list.",
  server:
    "Something went wrong saving your enquiry. Nothing was lost on your end — please try again, or call us.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error ? ERRORS[params.error] ?? ERRORS.server : null;

  return (
    <main className="wrap">
      <header className="masthead">
        <p className="eyebrow">Australian Payroll Association</p>
        <h1>
          <span className="org">APA</span> — payroll knowledge, when you need it
        </h1>
        <p className="standfirst">
          Membership and training for payroll professionals. Tell us what you
          need and your enquiry goes straight to the right team — no waiting on a
          transfer.
        </p>
        <div className="rule-gold" />
      </header>

      {sent && (
        <div className="banner ok" role="status">
          <p>
            <strong>Thank you — your enquiry is with us.</strong>
            It's been logged with a reference against your details, so it can't
            get lost. If it's a help desk question and your membership is
            current, it's already in the Help Desk queue.
          </p>
        </div>
      )}

      {error && (
        <div className="banner bad" role="alert">
          <p>
            <strong>We couldn't send that.</strong>
            {error}
          </p>
        </div>
      )}

      <h2>Make an enquiry</h2>

      <form className="form" action={submitInquiry}>
        <fieldset>
          <legend>What's this about</legend>
          <div className="field">
            <label htmlFor="type">
              Type of enquiry <span className="req">*</span>
            </label>
            <select id="type" name="type" required defaultValue="">
              <option value="" disabled>
                Choose one…
              </option>
              {INQUIRY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>You</legend>
          <div className="row">
            <div className="field">
              <label htmlFor="name">
                Your name <span className="req">*</span>
              </label>
              <input id="name" name="name" type="text" required maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="email">
                Email <span className="req">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" maxLength={40} />
            </div>
            <div className="field">
              <label htmlFor="company">Organisation</label>
              <input id="company" name="company" type="text" maxLength={150} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="role">Your role</label>
            <input id="role" name="role" type="text" maxLength={100} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Your details</legend>

          <div className="row">
            <div className="field">
              <label htmlFor="membership_number">
                Membership number
                <span className="hint">
                  If you're a member, this gets your question to the Help Desk
                  faster.
                </span>
              </label>
              <input
                id="membership_number"
                name="membership_number"
                type="text"
                maxLength={60}
              />
            </div>
            <div className="field">
              <label htmlFor="state">State or territory</label>
              <select id="state" name="state" defaultValue="">
                <option value="">Not specified</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <input id="industry" name="industry" type="text" maxLength={120} />
            </div>
            <div className="field">
              <label htmlFor="modern_award">
                Modern award
                <span className="hint">The award that applies, if you know it.</span>
              </label>
              <input
                id="modern_award"
                name="modern_award"
                type="text"
                maxLength={200}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Your enquiry</legend>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" type="text" maxLength={200} />
          </div>
          <div className="field">
            <label htmlFor="message">
              What do you need help with? <span className="req">*</span>
            </label>
            <textarea id="message" name="message" required maxLength={5000} />
          </div>
        </fieldset>

        <div className="checkline">
          <input id="ok_to_contact" name="ok_to_contact" type="checkbox" />
          <label htmlFor="ok_to_contact">
            Keep me updated by email about payroll changes and APA training.
          </label>
        </div>

        <button className="submit" type="submit">
          Send enquiry
        </button>
      </form>
    </main>
  );
}
