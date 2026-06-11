import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/google-server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Store the Google refresh token server-side so we can sync calendars
      // for this user later (freeze → everyone's calendar, free/busy reads).
      const refreshToken = data?.session?.provider_refresh_token;
      const userId = data?.session?.user?.id;
      if (refreshToken && userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await serviceClient().from("google_tokens").upsert({
            user_id: userId,
            refresh_token: refreshToken,
            updated_at: new Date().toISOString(),
          });
        } catch {} // never block sign-in on token storage
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth`);
}
