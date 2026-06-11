"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Calendar, Users, Snowflake, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

const FEATURES = [
  {
    icon: Users,
    title: "One crew, zero group-chat chaos",
    text: "Create a group and share an invite link. Everyone marks which upcoming weekends they're free, busy, or traveling — so you can see at a glance when the crew can actually meet.",
  },
  {
    icon: Sparkles,
    title: "Suggest plans, vote with one tap",
    text: "Anyone can propose a plan for a weekend — a hike, movie night, concert, or trip — and friends vote \"I'm in.\" No more 200-message threads that go nowhere.",
  },
  {
    icon: Snowflake,
    title: "Freeze it to make it official",
    text: "When enough friends are in, freeze the plan. It locks the weekend and shows up on everyone's plan list — so the plan actually happens.",
  },
  {
    icon: Calendar,
    title: "Optional Google Calendar sync",
    text: "If you choose to connect your Google Calendar, Weekend Crew can auto-fill your free/busy weekends and add frozen plans straight to your calendar. This is entirely optional — the app works fully without it.",
  },
];

export default function Landing() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/app");
      else setChecking(false);
    });
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-3"><PartyPopper size={40} className="text-teal-600" /></div>
          <h1 className="text-3xl font-extrabold text-slate-800">Weekend Crew</h1>
          <p className="text-slate-500 mt-2 mb-8">
            Mark when you&apos;re free. See when friends are. Lock in plans before
            decision fatigue wins.
          </p>
          {!checking && (
            <button
              onClick={() => signInWithGoogle(supabase)}
              className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:opacity-90 transition"
            >
              Continue with Google
            </button>
          )}
          <p className="text-xs text-slate-400 mt-4">
            Sign-in shares just your name &amp; email. Calendar sync is optional, later.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-white text-xl font-extrabold text-center">What is Weekend Crew?</h2>
          <p className="text-slate-300 text-sm text-center mt-2 max-w-lg mx-auto">
            Weekend Crew is a free weekend-planning app for friend groups. Instead of endless
            group-chat polls, your crew sees everyone&apos;s availability for upcoming weekends in
            one place, votes on plan ideas, and locks in the winners.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {FEATURES.map((f) => {
              const I = f.icon;
              return (
                <div key={f.title} className="bg-white/10 backdrop-blur rounded-3xl p-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3">
                    <I size={20} />
                  </div>
                  <h3 className="text-white font-bold text-sm">{f.title}</h3>
                  <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-10 text-center">
          Built for friends, by friends. Questions?{" "}
          <a href="mailto:sanchitpurdue@gmail.com" className="underline hover:text-slate-200">Contact us</a>
        </p>
        <p className="text-xs text-slate-400 mt-2 text-center">
          <a href="/privacy" className="hover:text-slate-200 underline">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="hover:text-slate-200 underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
