export const metadata = { title: "Terms of Service — Weekend Crew" };

export default function Terms() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12 text-slate-700">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: June 11, 2026</p>

        <p className="mt-6">
          Weekend Crew is a free app for planning weekends with friends. By using it, you agree to
          these terms.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Use of the service</h2>
        <p className="mt-2">
          You may use Weekend Crew to coordinate plans with people you know. Don&apos;t use it to spam,
          harass, or do anything unlawful. You are responsible for the content you post to your
          groups.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">Your data</h2>
        <p className="mt-2">
          How we handle your information is described in our{" "}
          <a className="text-teal-700 underline" href="/privacy">Privacy Policy</a>. You can stop
          using the service and request deletion of your data at any time.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">No warranty</h2>
        <p className="mt-2">
          The service is provided “as is,” without warranties of any kind. We may change or
          discontinue the service at any time. We are not liable for missed plans, double-booked
          weekends, or any damages arising from use of the app.
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
