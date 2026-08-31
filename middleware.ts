import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Locks /admin.
 *
 * Every /admin route except the login page requires a signed-in user.
 * Anyone else is bounced to /admin/login. This also refreshes the auth
 * cookie on each request so sessions don't expire mid-use.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed: if auth isn't configured, /admin stays shut.
  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) {
    if (request.nextUrl.pathname !== "/admin/login") {
      const to = request.nextUrl.clone();
      to.pathname = "/admin/login";
      return NextResponse.redirect(to);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(to);
  }

  // Already signed in? No reason to show the login form.
  if (user && isLoginPage) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/leads";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
