"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Users, Sparkles, MapPin, Plus, Check, Plane, PartyPopper,
  Snowflake, Ticket, Film, Mountain, Music, Home, ExternalLink,
  ChevronLeft, MessageCircle, Lock, Sun, Copy, LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile, enableCalendarSync, EMOJIS, COLORS } from "@/lib/auth";
import { getUpcomingWeekends } from "@/lib/weekends";
import { getNearbyIdeas } from "@/lib/events";

const TYPE_META = {
  concert: { icon: Music, label: "Concert", chip: "bg-indigo-100 text-indigo-700" },
  movie: { icon: Film, label: "Movie", chip: "bg-blue-100 text-blue-700" },
  hike: { icon: Mountain, label: "Outdoors", chip: "bg-emerald-100 text-emerald-700" },
  trip: { icon: Plane, label: "Trip", chip: "bg-amber-100 text-amber-700" },
  chill: { icon: Home, label: "Chill", chip: "bg-slate-200 text-slate-700" },
};

const STATUS_META = {
  free: { label: "Free", emoji: "🟢", chip: "bg-green-100 text-green-700 border-green-300" },
  busy: { label: "Busy", emoji: "🔴", chip: "bg-red-100 text-red-600 border-red-300" },
  traveling: { label: "Traveling", emoji: "✈️", chip: "bg-sky-100 text-sky-700 border-sky-300" },
  unset: { label: "Not set", emoji: "⚪", chip: "bg-gray-100 text-gray-400 border-gray-200" },
};

function Avatar({ p, size = "w-8 h-8", ring = "" }) {
  if (!p) return null;
  return (
    <div className={`${size} ${p.color} ${ring} rounded-full flex items-center justify-center text-sm shadow-sm`} title={p.name}>
      <span>{p.emoji}</span>
    </div>
  );
}

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.unset;
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${m.chip} whitespace-nowrap`}>{m.emoji} {m.label}</span>;
}

export default function App() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const weekends = useMemo(() => getUpcomingWeekends(10), []);

  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [syncEnabled, setSyncEnabled] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [noGroup, setNoGroup] = useState(false);
  const [members, setMembers] = useState([]); // profiles
  const [availability, setAvailability] = useState({}); // key -> userId -> {status, comment}
  const [suggestions, setSuggestions] = useState([]); // {..., votes: [userId]}
  const [tab, setTab] = useState("weekends");
  const [openWeekend, setOpenWeekend] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [newSug, setNewSug] = useState({ title: "", type: "chill", link: "" });
  const [groupForm, setGroupForm] = useState({ name: "", code: "" });
  const [toast, setToast] = useState(null);

  const ping = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const loadGroupData = useCallback(async (g) => {
    const { data: gm } = await supabase.from("group_members").select("user_id").eq("group_id", g.id);
    const ids = (gm || []).map((m) => m.user_id);
    const [{ data: profiles }, { data: avail }, { data: sugs }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("availability").select("*").eq("group_id", g.id),
      supabase.from("suggestions").select("*").eq("group_id", g.id).order("created_at"),
    ]);
    const sugIds = (sugs || []).map((s) => s.id);
    let votes = [];
    if (sugIds.length) {
      const { data: v } = await supabase.from("votes").select("*").in("suggestion_id", sugIds);
      votes = v || [];
    }
    setMembers(profiles || []);
    const aMap = {};
    (avail || []).forEach((a) => {
      aMap[a.weekend_key] = aMap[a.weekend_key] || {};
      aMap[a.weekend_key][a.user_id] = { status: a.status, comment: a.comment };
    });
    setAvailability(aMap);
    setSuggestions((sugs || []).map((s) => ({ ...s, votes: votes.filter((v) => v.suggestion_id === s.id).map((v) => v.user_id) })));
  }, [supabase]);

  const bootstrap = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return router.replace("/");
    setUser(u);
    await ensureProfile(supabase, u);
    fetch("/api/sync-status").then((r) => r.json()).then((j) => setSyncEnabled(!!j.enabled)).catch(() => {});
    const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", u.id);
    if (!memberships?.length) return setNoGroup(true);
    const ids = memberships.map((m) => m.group_id);
    const { data: gs } = await supabase.from("groups").select("*").in("id", ids).order("created_at");
    setMyGroups(gs || []);
    let saved = null;
    try { saved = localStorage.getItem("wc-group"); } catch {}
    const g = (gs || []).find((x) => x.id === saved) || gs?.[0];
    if (!g) return setNoGroup(true);
    setGroup(g);
    setNoGroup(false);
    await loadGroupData(g);
    // Auto-fill availability from everyone's Google Calendars (fills gaps only).
    try {
      const r = await fetch("/api/sync-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: g.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.updated > 0) {
        await loadGroupData(g);
        ping("📡 Synced availability from Google Calendars");
      }
    } catch {}
  }, [supabase, router, loadGroupData]);

  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => {
    const onFocus = () => group && loadGroupData(group);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [group, loadGroupData]);

  // ----- actions -----
  const setMyStatus = async (key, status) => {
    setAvailability((p) => ({ ...p, [key]: { ...p[key], [user.id]: { ...(p[key]?.[user.id] || {}), status } } }));
    await supabase.from("availability").upsert({ group_id: group.id, user_id: user.id, weekend_key: key, status, comment: availability[key]?.[user.id]?.comment || null });
    ping(`You're ${STATUS_META[status].label.toLowerCase()} ${STATUS_META[status].emoji}`);
  };

  const setMyComment = async (key, comment) => {
    const status = availability[key]?.[user.id]?.status || "free";
    setAvailability((p) => ({ ...p, [key]: { ...p[key], [user.id]: { status, comment } } }));
    await supabase.from("availability").upsert({ group_id: group.id, user_id: user.id, weekend_key: key, status, comment });
    ping("💬 Comment saved");
  };

  const addSuggestion = async (key) => {
    if (!newSug.title.trim()) return;
    const { data: s, error } = await supabase.from("suggestions")
      .insert({ group_id: group.id, weekend_key: key, type: newSug.type, title: newSug.title.trim(), link: newSug.link.trim() || null, created_by: user.id })
      .select().single();
    if (error) return ping("⚠️ Couldn't add suggestion");
    await supabase.from("votes").insert({ suggestion_id: s.id, user_id: user.id });
    setSuggestions((p) => [...p, { ...s, votes: [user.id] }]);
    setNewSug({ title: "", type: "chill", link: "" });
    setShowSuggestForm(false);
    ping("💡 Suggestion added!");
  };

  const toggleVote = async (sid) => {
    const s = suggestions.find((x) => x.id === sid);
    if (!s || s.frozen) return;
    const has = s.votes.includes(user.id);
    setSuggestions((p) => p.map((x) => x.id === sid ? { ...x, votes: has ? x.votes.filter((v) => v !== user.id) : [...x.votes, user.id] } : x));
    if (has) await supabase.from("votes").delete().eq("suggestion_id", sid).eq("user_id", user.id);
    else await supabase.from("votes").insert({ suggestion_id: sid, user_id: user.id });
  };

  const freeze = async (s) => {
    ping("🧊 Freezing & syncing calendars…");
    const res = await fetch("/api/freeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: s.id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return ping("⚠️ Couldn't freeze plan");
    setSuggestions((p) => p.map((x) => (x.id === s.id ? { ...x, frozen: true } : x)));
    if (j.calendarAdded > 0) {
      ping(`🧊 Frozen — added to ${j.calendarAdded}/${j.totalVoters} Google Calendars!`);
    } else {
      ping("🧊 Plan frozen! Use “Add to Google Cal” or enable sync");
    }
  };

  // Google Calendar event-template link — works with zero permissions.
  const gcalLink = (s) => {
    const w = weekends.find((x) => x.key === s.weekend_key);
    const start = (w?.startISO || s.weekend_key).replaceAll("-", "");
    const end = (w?.endISOExclusive || "").replaceAll("-", "");
    const p = new URLSearchParams({
      action: "TEMPLATE",
      text: `🎉 ${s.title}`,
      dates: `${start}/${end}`,
      details: `Weekend Crew · ${group?.name || ""}`,
    });
    return `https://calendar.google.com/calendar/render?${p}`;
  };

  const selectGroup = async (g) => {
    try { localStorage.setItem("wc-group", g.id); } catch {}
    setGroup(g); setNoGroup(false); setOpenWeekend(null);
    await loadGroupData(g);
  };

  const createGroup = async () => {
    if (!groupForm.name.trim()) return;
    const { data: g, error } = await supabase.from("groups").insert({ name: groupForm.name.trim(), created_by: user.id }).select().single();
    if (error) return ping("⚠️ Couldn't create group");
    await supabase.from("group_members").insert({ group_id: g.id, user_id: user.id });
    setMyGroups((p) => [...p, g]);
    await selectGroup(g);
  };

  const joinByCode = async () => {
    const { data: g } = await supabase.from("groups").select("*").eq("invite_code", groupForm.code.trim().toUpperCase()).maybeSingle();
    if (!g) return ping("⚠️ Invalid invite code");
    await supabase.from("group_members").upsert({ group_id: g.id, user_id: user.id });
    setMyGroups((p) => (p.some((x) => x.id === g.id) ? p : [...p, g]));
    await selectGroup(g);
  };

  const saveAvatar = async (emoji, color) => {
    await supabase.from("profiles").update({ emoji, color }).eq("id", user.id);
    setMembers((p) => p.map((m) => (m.id === user.id ? { ...m, emoji, color } : m)));
    setShowAvatarPicker(false);
    ping(`${emoji} Looking good!`);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`);
    ping("🔗 Invite link copied — drop it in the group chat!");
  };

  const signOut = async () => { await supabase.auth.signOut(); router.replace("/"); };

  // ----- derived -----
  const me = members.find((m) => m.id === user?.id);
  const freeCount = (key) => members.filter((m) => availability[key]?.[m.id]?.status === "free").length;
  const frozenPlans = suggestions.filter((s) => s.frozen);
  const myFrozen = frozenPlans.filter((s) => s.votes.includes(user?.id));

  if (!user) return <div className="min-h-dvh bg-slate-50 flex items-center justify-center text-slate-400">Loading…</div>;

  // ----- no group yet -----
  if (noGroup) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-extrabold text-slate-800 text-center">Set up your crew</h1>
          <p className="text-slate-500 text-sm text-center mt-1 mb-6">Create a group, or join one with an invite code.</p>
          <div className="space-y-2">
            <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="Group name (e.g. The Bay Crew)"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
            <button onClick={createGroup} className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold py-2.5 rounded-2xl">Create group</button>
          </div>
          <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200" /></div>
          <div className="space-y-2">
            <input value={groupForm.code} onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
              placeholder="Invite code (e.g. A1B2C3)"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none uppercase" />
            <button onClick={joinByCode} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-2xl">Join with code</button>
          </div>
        </div>
        {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-xl">{toast}</div>}
      </div>
    );
  }

  if (!group) return <div className="min-h-dvh bg-slate-50 flex items-center justify-center text-slate-400">Loading your crew…</div>;

  // ----- weekend detail -----
  const renderWeekendDetail = () => {
    const w = weekends.find((x) => x.key === openWeekend);
    const mine = availability[w.key]?.[user.id] || { status: "unset" };
    const sugs = suggestions.filter((s) => s.weekend_key === w.key);
    const ideas = getNearbyIdeas(w, group.city);

    return (
      <div className="max-w-2xl mx-auto px-4 pb-28">
        <button onClick={() => setOpenWeekend(null)} className="flex items-center gap-1 text-teal-700 font-semibold mt-4 mb-2">
          <ChevronLeft size={18} /> All weekends
        </button>

        <div className={`rounded-3xl p-5 text-white shadow-lg ${w.long ? "bg-gradient-to-r from-teal-700 to-emerald-600" : "bg-gradient-to-r from-slate-800 to-indigo-800"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">{w.label}</h2>
              <p className="text-white/90 text-sm">{w.dates}</p>
            </div>
            {w.long && <div className="bg-white/25 rounded-2xl px-3 py-1.5 text-sm font-bold">🌟 Long weekend · {w.holiday}</div>}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-5 mt-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Sun size={18} className="text-amber-500" /> Your availability</h3>
          <div className="flex gap-2">
            {["free", "busy", "traveling"].map((st) => (
              <button key={st} onClick={() => setMyStatus(w.key, st)}
                className={`flex-1 py-2.5 rounded-2xl border-2 font-semibold text-sm transition ${mine.status === st ? STATUS_META[st].chip + " border-current scale-105" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {STATUS_META[st].emoji} {STATUS_META[st].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
              placeholder={mine.comment ? `"${mine.comment}" — update?` : "Optional comment (e.g. free after 2pm)"}
              className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-2 text-sm focus:border-teal-400 outline-none" />
            <button onClick={() => { if (commentDraft.trim()) { setMyComment(w.key, commentDraft.trim()); setCommentDraft(""); } }}
              className="bg-gray-800 text-white rounded-2xl px-4 text-sm font-semibold">Save</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-5 mt-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Users size={18} className="text-slate-500" /> The crew ({freeCount(w.key)}/{members.length} free)</h3>
          <div className="space-y-2.5">
            {members.map((m) => {
              const a = availability[w.key]?.[m.id] || { status: "unset" };
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar p={m} />
                  <span className={`font-medium text-sm w-20 truncate ${m.id === user.id ? "text-teal-700" : "text-gray-700"}`}>{m.id === user.id ? "You" : m.name}</span>
                  <StatusChip status={a.status} />
                  {a.comment && <span className="text-xs text-gray-400 italic truncate flex items-center gap-1"><MessageCircle size={11} /> {a.comment}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Sparkles size={18} className="text-teal-600" /> Plans & votes</h3>
            <button onClick={() => setShowSuggestForm(!showSuggestForm)}
              className="flex items-center gap-1 bg-teal-50 text-teal-700 font-semibold text-sm px-3 py-1.5 rounded-2xl hover:bg-teal-100 transition">
              <Plus size={15} /> Suggest
            </button>
          </div>

          {showSuggestForm && (
            <div className="border-2 border-dashed border-teal-300 rounded-2xl p-4 mb-4 bg-teal-50/50">
              <input value={newSug.title} onChange={(e) => setNewSug({ ...newSug, title: e.target.value })}
                placeholder="What's the plan? (e.g. movie night at my place 🍿)"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm mb-2 focus:border-teal-400 outline-none bg-white" />
              <div className="flex gap-2 mb-2 flex-wrap">
                {Object.entries(TYPE_META).map(([t, m]) => (
                  <button key={t} onClick={() => setNewSug({ ...newSug, type: t })}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${newSug.type === t ? m.chip + " ring-2 ring-offset-1 ring-teal-300" : "bg-gray-100 text-gray-400"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <input value={newSug.link} onChange={(e) => setNewSug({ ...newSug, link: e.target.value })}
                placeholder="Booking link (optional — Ticketmaster, AMC, Airbnb…)"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm mb-2 focus:border-teal-400 outline-none bg-white" />
              <button onClick={() => addSuggestion(w.key)} className="w-full bg-teal-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-teal-700 transition">Add suggestion</button>
            </div>
          )}

          {sugs.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No plans yet — be the first to suggest something! 💡</p>}

          <div className="space-y-3">
            {sugs.map((s) => {
              const T = TYPE_META[s.type] || TYPE_META.chill;
              const iVoted = s.votes.includes(user.id);
              const canFreeze = s.votes.length >= 2 && !s.frozen && iVoted;
              const author = members.find((m) => m.id === s.created_by);
              return (
                <div key={s.id} className={`rounded-2xl border-2 p-4 ${s.frozen ? "border-cyan-300 bg-cyan-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${T.chip}`}>{T.label}</span>
                      <p className="font-semibold text-gray-800 mt-1.5">{s.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">by {s.created_by === user.id ? "you" : author?.name || "a friend"}</p>
                    </div>
                    {s.frozen && <span className="flex items-center gap-1 bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"><Snowflake size={12} /> Frozen!</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex -space-x-1.5 items-center">
                      {s.votes.map((v) => <Avatar key={v} p={members.find((m) => m.id === v)} size="w-6 h-6" ring="ring-2 ring-white" />)}
                      <span className="text-xs text-gray-500 pl-3">{s.votes.length} in</span>
                    </div>
                    <div className="flex gap-2">
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-xl hover:bg-blue-100">
                          <Ticket size={13} /> Book
                        </a>
                      )}
                      {!s.frozen && (
                        <button onClick={() => toggleVote(s.id)}
                          className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition ${iVoted ? "bg-green-500 text-white" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-green-400"}`}>
                          {iVoted ? <><Check size={13} /> I&apos;m in</> : "Count me in"}
                        </button>
                      )}
                      {canFreeze && (
                        <button onClick={() => freeze(s)}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition">
                          <Snowflake size={13} /> Freeze plan
                        </button>
                      )}
                    </div>
                  </div>
                  {s.votes.length >= 2 && !s.frozen && (
                    <p className="text-xs text-amber-600 font-medium mt-2">✨ {s.votes.length} friends aligned — freeze it to lock schedules!</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-5 mt-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={18} className="text-red-400" /> Happening nearby</h3>
          <div className="space-y-2.5">
            {ideas.map((e, i) => {
              const T = TYPE_META[e.type];
              const I = T.icon;
              return (
                <div key={i} className="flex items-center gap-3 border-2 border-gray-100 rounded-2xl p-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${T.chip}`}><I size={17} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400">{T.label} · {e.site}</p>
                  </div>
                  <a href={e.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100 whitespace-nowrap">
                    <ExternalLink size={12} /> Browse
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ----- weekends list -----
  const renderWeekendsList = () => (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      <div className="mt-5 mb-4">
        <h2 className="text-2xl font-extrabold text-gray-800">Upcoming weekends</h2>
        <p className="text-gray-500 text-sm">Tap a weekend to set availability & make plans 🎯</p>
      </div>
      {syncEnabled === false && (
        <button onClick={() => enableCalendarSync(supabase)}
          className="w-full mb-4 text-left bg-gradient-to-r from-indigo-50 to-teal-50 border-2 border-teal-200 rounded-3xl p-4 hover:border-teal-400 transition">
          <p className="font-bold text-gray-800 text-sm">📅 Enable calendar sync</p>
          <p className="text-xs text-gray-500 mt-0.5">Auto-fill your availability & get frozen plans on your Google Calendar. Google shows a one-time “unverified app” notice — tap Advanced → continue.</p>
        </button>
      )}
      <div className="space-y-3">
        {weekends.map((w) => {
          const fc = freeCount(w.key);
          const wSugs = suggestions.filter((s) => s.weekend_key === w.key);
          const frozen = wSugs.find((s) => s.frozen);
          const myStatus = availability[w.key]?.[user.id]?.status || "unset";
          return (
            <button key={w.key} onClick={() => { setOpenWeekend(w.key); setCommentDraft(""); setShowSuggestForm(false); }}
              className={`w-full text-left bg-white rounded-3xl shadow-sm hover:shadow-md transition p-4 border-2 ${frozen ? "border-cyan-300" : w.long ? "border-teal-300" : "border-transparent"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-800">{w.label}</span>
                    {w.long && <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">🌟 {w.holiday}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex -space-x-1.5">
                      {members.filter((m) => availability[w.key]?.[m.id]?.status === "free").map((m) => (
                        <Avatar key={m.id} p={m} size="w-6 h-6" ring="ring-2 ring-white" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{fc} free</span>
                    {wSugs.length > 0 && <span className="text-xs text-teal-700 font-semibold">· {wSugs.length} plan{wSugs.length > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div className="text-right">
                  {frozen ? (
                    <span className="flex items-center gap-1 bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full"><Snowflake size={12} /> Locked in</span>
                  ) : (
                    <StatusChip status={myStatus} />
                  )}
                </div>
              </div>
              {frozen && <p className="text-xs text-cyan-700 font-medium mt-2">📌 {frozen.title}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ----- my calendar -----
  const renderCalendar = () => (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      <div className="mt-5 mb-4">
        <h2 className="text-2xl font-extrabold text-gray-800">My calendar</h2>
        <p className="text-gray-500 text-sm">Your locked-in plans{me ? `, ${me.name} ${me.emoji}` : ""}</p>
      </div>
      {myFrozen.length === 0 ? (
        <div className="bg-white rounded-3xl shadow p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">🗓️</div>
          Nothing locked in yet.<br />Vote on a plan and freeze it!
        </div>
      ) : (
        <div className="space-y-3">
          {myFrozen.map((s) => {
            const w = weekends.find((x) => x.key === s.weekend_key);
            const T = TYPE_META[s.type] || TYPE_META.chill;
            const I = T.icon;
            return (
              <div key={s.id} className="bg-white rounded-3xl shadow p-4 border-l-8 border-cyan-400">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${T.chip}`}><I size={19} /></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-500">{w?.dates || s.weekend_key}</p>
                  </div>
                  <Lock size={16} className="text-cyan-500" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-1.5">
                    {s.votes.map((v) => <Avatar key={v} p={members.find((m) => m.id === v)} size="w-6 h-6" ring="ring-2 ring-white" />)}
                  </div>
                  <div className="flex gap-2">
                    {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1"><Ticket size={12} /> Booking</a>}
                    <a href={gcalLink(s)} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <Calendar size={12} /> Add to Google Cal
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ----- crew tab -----
  const renderCrew = () => (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      {myGroups.length > 1 && (
        <div className="mt-5 -mb-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">My crews</p>
          <div className="flex gap-2 flex-wrap">
            {myGroups.map((g) => (
              <button key={g.id} onClick={() => selectGroup(g)}
                className={`text-sm font-bold px-4 py-2 rounded-2xl border-2 transition ${g.id === group.id ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"}`}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5 mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">{group.name}</h2>
          <p className="text-gray-500 text-sm">Invite code: <b>{group.invite_code}</b></p>
        </div>
        <button onClick={copyInvite} className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-2 rounded-xl hover:bg-teal-100">
          <Copy size={13} /> Copy invite link
        </button>
      </div>
      <div className="bg-white rounded-3xl shadow p-5 space-y-3">
        {members.map((m) => {
          const fFrozen = frozenPlans.filter((s) => s.votes.includes(m.id)).length;
          return (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar p={m} size="w-10 h-10" />
              <div className="flex-1">
                <p className="font-bold text-gray-800">{m.name} {m.id === user.id && <span className="text-xs text-teal-600">(you)</span>}</p>
                <p className="text-xs text-gray-400">{fFrozen} plan{fFrozen !== 1 ? "s" : ""} locked in</p>
              </div>
              {m.id === user.id && (
                <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100">
                  Change avatar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {showAvatarPicker && me && (
        <div className="bg-white rounded-3xl shadow p-5 mt-4">
          <p className="font-bold text-gray-800 mb-3">Pick your vibe</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => saveAvatar(e, me.color)}
                className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center border-2 transition ${me.emoji === e ? "border-teal-500 bg-teal-50 scale-110" : "border-gray-100 hover:border-gray-300"}`}>
                {e}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => saveAvatar(me.emoji, c)}
                className={`w-9 h-9 rounded-full ${c} border-4 transition ${me.color === c ? "border-gray-800 scale-110" : "border-white"}`} />
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 text-center">
        {syncEnabled ? (
          <p className="text-xs text-gray-400">📅 Calendar sync is on</p>
        ) : (
          <button onClick={() => enableCalendarSync(supabase)} className="text-xs font-bold text-teal-700 hover:underline">
            📅 Enable calendar sync
          </button>
        )}
      </div>
      <button onClick={signOut} className="mt-6 mx-auto flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600">
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="bg-white/80 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PartyPopper size={22} className="text-teal-600" />
            <span className="font-extrabold text-gray-800 text-lg">Weekend Crew</span>
          </div>
          <div className="flex items-center gap-2">
            {me && <span className="text-sm text-gray-500 hidden sm:inline">Hey {me.name}!</span>}
            <button onClick={() => { setTab("crew"); setOpenWeekend(null); setShowAvatarPicker(true); }}>
              <Avatar p={me} />
            </button>
          </div>
        </div>
      </div>

      {openWeekend ? renderWeekendDetail() : tab === "weekends" ? renderWeekendsList() : tab === "calendar" ? renderCalendar() : renderCrew()}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-xl z-30">
          {toast}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20">
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: "weekends", icon: Sparkles, label: "Weekends" },
            { id: "calendar", icon: Calendar, label: "My Calendar" },
            { id: "crew", icon: Users, label: "Crew" },
          ].map((t) => {
            const I = t.icon;
            const active = tab === t.id && !openWeekend;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setOpenWeekend(null); }}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition ${active ? "text-teal-700" : "text-gray-400"}`}>
                <I size={20} className="mb-0.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
