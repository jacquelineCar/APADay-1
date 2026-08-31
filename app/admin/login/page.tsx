import { signIn } from "../auth-actions";

const ERRORS: Record<string, string> = {
  missing: "Please enter both your email and your password.",
  denied: "That email and password combination didn't work. Please try again.",
  config:
    "Sign-in isn't configured on this deployment yet. The Supabase keys are missing, so nobody can sign in until they're set.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; signedout?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? ERRORS[params.error] ?? ERRORS.denied : null;

  return (
    <>
      <main className="wrap login">
        <h2>Sign in</h2>
        <p className="standfirst">
          This area is for APA staff. Sign in to see incoming enquiries.
        </p>

        {params.signedout === "1" && (
          <div className="banner ok" role="status">
            <p>
              <strong>You're signed out.</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="banner bad" role="alert">
            <p>
              <strong>Couldn't sign you in.</strong>
              {error}
            </p>
          </div>
        )}

        <form className="form" action={signIn}>
          <input type="hidden" name="next" value={params.next ?? "/admin/leads"} />

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              maxLength={254}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          <button className="submit" type="submit">
            Sign in
          </button>
        </form>
      </main>
    </>
  );
}
