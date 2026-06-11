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
      let group = null;
      if (user) {
        const { data } = await supabase
          .from("groups").select("id, name, invite_code")
          .eq("invite_code", String(code).toUpperCase()).maybeSingle();
        group = data;
      } else {
        // Signed-out visitors get a name-only preview via a safe RPC.
        const { data } = await supabase.rpc("group_preview", { code: String(code) });
        if (data?.length) group = { name: data[0].name, preview: true };
      }
      if (!group) return setState({ loading: false, group: null, user, error: "This invite link doesn't look right — ask your friend for a fresh one." });
      setState({ loading: false, group, user, error: null });
    })();
  }, [code]);

  const join = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await ensureProfile(supabase, user);
    const { data: g } = await supabase
      .from("groups").select("id")
      .eq("invite_code", String(code).toUpperCase()).maybeSingle();
    if (g) {
      await supabase.from("group_members").upsert({ group_id: g.id, user_id: user.id });
      try { localStorage.setItem("wc-group", g.id); } catch {}
    }
    router.replace("/app");
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-3"><Users size={36} className="text-teal-600" /></div>
        {state.loading ? (
          <p className="text-slate-500">Loading invite…</p>
        ) : state.error ? (
          <>
            <h1 className="text-xl font-extrabold text-slate-800">Hmm.</h1>
            <p className="text-slate-500 mt-2">{state.error}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-slate-800">Join “{state.group.name}”</h1>
            <p className="text-slate-500 mt-2 mb-6">Your friends are planning weekends here. Sign in with Google to join the crew — it just shares your name &amp; email.</p>
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
