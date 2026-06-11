import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { serviceClient, getAccessToken, queryFreeBusy, busyHoursIn } from "@/lib/google-server";
import { getUpcomingWeekends } from "@/lib/weekends";

export const dynamic = "force-dynamic";

const WEEKENDS_TO_SYNC = 6;
const BUSY_THRESHOLD_HOURS = 4; // 4+ busy hours over the weekend → "busy"

// Auto-fill availability from members' Google Calendars (free/busy).
// Only fills weekends a member hasn't set manually — never overwrites.
export async function POST(request) {
  const { groupId } = await request.json().catch(() => ({}));
  if (!groupId) return NextResponse.json({ error: "missing groupId" }, { status: 400 });

  const { data: { user } } = await createRouteClient().auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = serviceClient();
  const { data: mem } = await admin.from("group_members").select("user_id")
    .eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  const weekends = getUpcomingWeekends(WEEKENDS_TO_SYNC);
  const [{ data: gm }, { data: existing }] = await Promise.all([
    admin.from("group_members").select("user_id").eq("group_id", groupId),
    admin.from("availability").select("user_id, weekend_key").eq("group_id", groupId),
  ]);
  const memberIds = (gm || []).map((m) => m.user_id);
  const hasRow = new Set((existing || []).map((a) => `${a.user_id}|${a.weekend_key}`));

  const { data: tokens } = await admin.from("google_tokens")
    .select("user_id, refresh_token").in("user_id", memberIds);

  // One free/busy query per member covering all upcoming weekends.
  const timeMin = `${weekends[0].startISO}T00:00:00-07:00`;
  const timeMax = `${weekends[weekends.length - 1].endISOExclusive}T00:00:00-07:00`;

  const rows = [];
  let synced = 0;
  for (const t of tokens || []) {
    const missing = weekends.filter((w) => !hasRow.has(`${t.user_id}|${w.key}`));
    if (!missing.length) continue;
    const at = await getAccessToken(t.refresh_token);
    if (!at) continue;
    const busy = await queryFreeBusy(at, timeMin, timeMax);
    if (busy === null) continue;
    synced++;
    for (const w of missing) {
      const ws = new Date(`${w.startISO}T00:00:00-07:00`);
      const we = new Date(`${w.endISOExclusive}T00:00:00-07:00`);
      const hours = busyHoursIn(busy, ws, we);
      rows.push({
        group_id: groupId,
        user_id: t.user_id,
        weekend_key: w.key,
        status: hours >= BUSY_THRESHOLD_HOURS ? "busy" : "free",
        comment: "via Google Calendar",
      });
    }
  }

  if (rows.length) {
    // ignoreDuplicates: a manual entry created mid-sync always wins
    await admin.from("availability").upsert(rows, {
      onConflict: "group_id,user_id,weekend_key",
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ updated: rows.length, membersSynced: synced });
}
