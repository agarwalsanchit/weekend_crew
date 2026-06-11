export const metadata = { title: "Privacy Policy — Weekend Crew" };

export default function Privacy() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12 text-slate-700">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: June 11, 2026</p>

        <p className="mt-6">
          Weekend Crew is a small app for planning weekends with friends. This policy explains
          what information we collect and how we use it.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Information we collect</h2>
        <p className="mt-2">
          When you sign in with Google, we receive your name, email address, and profile picture.
          We use this only to identify you inside your groups. Within the app, we store the
          availability, comments, plan suggestions, and votes you choose to share with your group.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Google Calendar (optional)</h2>
        <p className="mt-2">
          If you choose to enable calendar sync, you grant Weekend Crew permission to (1) check
          when you are busy or free, used solely to auto-fill your weekend availability for your
          group, and (2) add events to your calendar when a plan you voted for is locked in. We
          never read event titles, descriptions, attendees, or any other calendar details — only
          free/busy times. We never modify or delete existing events. You can revoke this access
          at any time at{" "}
          <a className="text-teal-700 underline" href="https://myaccount.google.com/permissions">
            myaccount.google.com/permissions
          </a>.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">How we use and share data</h2>
        <p className="mt-2">
          Your information is shared only with members of groups you join. We do not sell your
          data, show ads, or share your information with third parties. Data is stored securely
          with Supabase (our database provider) and the app is hosted on Vercel.
        </p>
        <p className="mt-2">
          Weekend Crew&apos;s use and transfer of information received from Google APIs adheres to the{" "}
          <a className="text-teal-700 underline" href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>, including the Limited Use requirements.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Data retention & deletion</h2>
        <p className="mt-2">
          To delete your account and all associated data (profile, availability, votes, and any
          stored calendar tokens), email{" "}
          <a className="text-teal-700 underline" href="mailto:sanchitpurdue@gmail.com">sanchitpurdue@gmail.com</a>{" "}
          and we will remove it promptly.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Contact</h2>
        <p className="mt-2">
          Questions? Email{" "}
          <a className="text-teal-700 underline" href="mailto:sanchitpurdue@gmail.com">sanchitpurdue@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
