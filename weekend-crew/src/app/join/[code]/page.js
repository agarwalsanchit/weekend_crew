"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, ensureProfile } from "@/lib/auth";

export default function JoinGroup() {
  const { code } = useParams();
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, group: null, user: null, error: null });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: group } = await supabase
        .from("groups").select("id, name, invite_code")
        .eq("invite_code", String(code).toUpperCase()).maybeSingle();
      if (!group) return setState({ loading: false, error: "Invalid invite code." });
      // not signed in → groups table requires auth, but we land here after sign-in too
      setState({ loading: false, group, user, error: null });
    })();
  }, [code]);

  const join = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await ensureProfile(supabase, user);
    await supabase.from("group_members").upsert({ group_id: state.group.id, user_id: user.id });
    router.replace("/app");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-3"><Users size={36} className="text-teal-600" /></div>
        {state.loading ? (
          <p className="text-slate-500">Loading invite…</p>
        ) : state.error ? (
          <>
            <h1 className="text-xl font-extrabold text-slate-800">Hmm.</h1>
            <p className="text-slate-500 mt-2">
              {state.user ? state.error : "Sign in to view this invite."}
            </p>
            {!state.user && (
              <button onClick={() => signInWithGoogle(supabase, `/join/${code}`)}
                className="mt-6 w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold py-3 rounded-2xl">
                Continue with Google
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-slate-800">Join “{state.group.name}”</h1>
            <p className="text-slate-500 mt-2 mb-6">Your friends are planning weekends here.</p>
            {state.user ? (
              <button onClick={join}
                className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:opacity-90 transition">
                Join the crew →
              </button>
            ) : (
              <button onClick={() => signInWithGoogle(supabase, `/join/${code}`)}
                className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:opacity-90 transition">
                Continue with Google to join
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
