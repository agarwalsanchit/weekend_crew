import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { serviceClient, getAccessToken, insertAllDayEvent } from "@/lib/google-server";
import { getUpcomingWeekends } from "@/lib/weekends";

export const dynamic = "force-dynamic";

// Freeze a plan and add it to EVERY voter's Google Calendar.
export async function POST(request) {
  const { suggestionId } = await request.json().catch(() => ({}));
  if (!suggestionId) return NextResponse.json({ error: "missing suggestionId" }, { status: 400 });

  const { data: { user } } = await createRouteClient().auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = serviceClient();
  const { data: s } = await admin.from("suggestions").select("*").eq("id", suggestionId).single();
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: mem } = await admin.from("group_members").select("user_id")
    .eq("group_id", s.group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  const { data: votes } = await admin.from("votes").select("user_id").eq("suggestion_id", suggestionId);
  const voters = (votes || []).map((v) => v.user_id);
  if (!voters.includes(user.id) || voters.length < 2) {
    return NextResponse.json({ error: "need 2+ voters incl. you" }, { status: 400 });
  }

  await admin.from("suggestions").update({ frozen: true }).eq("id", suggestionId);

  // Resolve weekend dates server-side (handles long weekends).
  const w = getUpcomingWeekends(30).find((x) => x.key === s.weekend_key);
  const startISO = w?.startISO || s.weekend_key;
  const endISOExclusive = w?.endISOExclusive ||
    new Date(new Date(s.weekend_key).getTime() + 2 * 86400000).toISOString().slice(0, 10);

  const { data: g } = await admin.from("groups").select("name").eq("id", s.group_id).single();
  const { data: tokens } = await admin.from("google_tokens")
    .select("user_id, refresh_token").in("user_id", voters);

  let calendarAdded = 0;
  for (const t of tokens || []) {
    const at = await getAccessToken(t.refresh_token);
    if (at && await insertAllDayEvent(at, {
      title: s.title,
      description: `Weekend Crew · ${g?.name || "your crew"}`,
      startISO, endISOExclusive,
    })) calendarAdded++;
  }

  return NextResponse.json({
    frozen: true,
    calendarAdded,
    totalVoters: voters.length,
    noToken: voters.length - (tokens?.length || 0),
  });
}
