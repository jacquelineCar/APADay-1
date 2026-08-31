import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { signOut } from "./auth-actions";

/**
 * Admin chrome. The login page renders inside this too, but it has no
 * session, so the nav and sign-out simply don't appear.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <>
      <div className="adminbar">
        <div className="wrap">
          <div className="title">
            <span className="org">APA</span> — Admin
          </div>

          {user && (
            <>
              <nav className="adminnav">
                <Link href="/admin/leads">Enquiries</Link>
                <Link href="/admin/people">People</Link>
                <Link href="/admin/orders">Orders</Link>
                <Link href="/admin/newsletter">Newsletter</Link>
              </nav>
              <form className="signout" action={signOut}>
                <span className="who-in">{user.email}</span>
                <button type="submit">Sign out</button>
              </form>
            </>
          )}
        </div>
      </div>
      {children}
    </>
  );
}
