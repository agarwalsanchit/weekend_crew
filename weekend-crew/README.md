# Weekend Crew 🎉

Plan weekends with your friends — without the 200-message WhatsApp chaos.
Friends sign in with Google, join your group via an invite link, mark when
they're free/busy/traveling, suggest plans, vote, and freeze plans into
everyone's Google Calendar.

Stack: Next.js 14 (App Router) · Supabase (auth + Postgres + RLS) · Tailwind · Vercel.

## Setup (~10 minutes, uses your existing Supabase & Vercel accounts)

### 1. Supabase project
1. In your Supabase dashboard, click **New project** (keep it separate from your other apps). Any region, free tier.
2. Open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

### 2. Google OAuth (sign-in + calendar)
1. In [Google Cloud Console](https://console.cloud.google.com), create/reuse a project → **APIs & Services → Credentials → Create OAuth client ID** (Web application).
2. Add this authorized redirect URI (find your project ref in the Supabase URL):
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. **APIs & Services → Library** → enable the **Google Calendar API**.
4. On the OAuth consent screen, add scope `https://www.googleapis.com/auth/calendar.events` and add your friends' emails as test users (or publish the app).
5. In Supabase: **Authentication → Providers → Google** → enable, paste the Client ID and Secret.

### 3. Run locally
```bash
cp .env.example .env.local   # paste your Supabase URL + anon key
npm install
npm run dev                  # http://localhost:3000
```
Also add `http://localhost:3000/**` to Supabase **Authentication → URL Configuration → Redirect URLs**.

### 4. Deploy on Vercel
1. Push this folder to a GitHub repo, then **Add New Project** in Vercel and import it.
2. Add the two env vars from `.env.example` in Vercel project settings.
3. After deploy, in Supabase **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: add `https://your-app.vercel.app/**`

### 5. Invite your crew
Sign in → create your group → **Crew tab → Copy invite link** → drop it in
WhatsApp once. Friends tap, sign in with Google, done.

## How it works
- **Weekends** are generated client-side (next 10 Saturdays); US holidays on the
  adjacent Friday/Monday flag a **long weekend** (Yosemite/Tahoe ideas appear).
- **Availability** is one row per (group, user, weekend): free / busy / traveling + optional comment. No details required — that's the point.
- **Suggestions & votes**: anyone proposes; "Count me in" to vote. At 2+ votes a
  voter can **Freeze** the plan — it locks and is written to their Google
  Calendar; other voters add it from **My Calendar → Add to Google Cal**.
- **Security**: Postgres Row Level Security — members only see their own group's data; you can only edit your own availability/votes.

## V2 ideas
- Supabase Realtime so votes/availability update live without refresh
- Read free/busy from Google Calendar to pre-fill availability
- Ticketmaster/Eventbrite APIs for a real event feed instead of deep links
- Push/WhatsApp reminders ("3 friends are free this weekend, no plan yet 👀")
- Multiple groups per user
