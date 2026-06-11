"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

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
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
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
          Google sign-in also lets the app add frozen plans to your calendar.
        </p>
      </div>
    </div>
  );
}
