import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/google-server";

export const dynamic = "force-dynamic";

// Does the calling user have calendar sync enabled (a stored refresh token)?
export async function GET() {
  const { data: { user } } = await createRouteClient().auth.getUser();
  if (!user) return NextResponse.json({ enabled: false });
  const { data } = await serviceClient().from("google_tokens")
    .select("user_id").eq("user_id", user.id).maybeSingle();
  return NextResponse.json({ enabled: !!data });
}
