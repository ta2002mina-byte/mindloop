# MindLoop Lab

> See the loop. Understand the pattern. Take the next step.

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.
This repository is the combined build of all five phases: **Phase 1** (setup, Supabase, auth, app shell), **Phase 2** (Thought Lab), **Phase 3** (the signature features), **Phase 4** (Decision Room, AI and Insights), and **Phase 5** (final polish and production readiness).

## What is built

### Phase 1
- Signup, login, logout, forgot password, reset password, persistent sessions
- `profiles` table with Row Level Security (each user can only read, create and update their own row)
- Route protection for `/dashboard`, `/thoughts`, `/patterns`, `/predictions`, `/worry-capsules`, `/decisions`, `/insights`, `/settings`
- Responsive app shell: sidebar on desktop, drawer on tablet and mobile, light/dark theme
- Working Settings > Profile form

### Phase 2 — Thought Lab
The full flow: **Trigger → Thought → Fact → Story → Emotion → Control → Traffic Light → Next Action**

- `/thoughts/new` — an eight-step guided analysis (Situation, Thought, Fact vs Story, Emotion, Control Map, Traffic Light, Next Action, Review) with a stepper, Back/Continue, per-step validation and a "Save draft" button
- Drafts autosave to the browser, so a refresh or a closed tab never loses an unfinished analysis. Nothing reaches your account until **Save Thought**
- `/thoughts` — cards with title, category, date, traffic light, status and next action, plus search, category filter, status filter and pagination
- `/thoughts/[id]` — the whole analysis, with Edit, Archive, Mark resolved, Delete (confirmation dialogs) and a tickable next action
- `/thoughts/[id]/edit` — the same wizard, prefilled
- Six new tables, all with RLS: `thoughts`, `thought_facts`, `thought_stories`, `emotions`, `control_items`, `actions`

### Phase 3 — Thought → Loop → Pattern → Prediction → Reality
- **Thought Loop Map** on `/thoughts/[id]`: Trigger → Thought → Assumption → Emotion → Repeated thinking (↺). Animated, keyboard-operable nodes; selecting a node shows what you wrote for that step. On phones the same steps stack and the details open under the step you tapped
- **Predictions** (`/predictions`): write a prediction with a 0–100% confidence and an expected date, wait, then review it against four fixed outcomes. A side-by-side comparison and a running tally show how reality compared. Predictions can be started from any thought
- **Worry Capsules** (`/worry-capsules`): seal a thought with an intensity (1–10) until tomorrow, 3 days, 7 days or a custom date. While sealed, the original text and intensity are **not sent to the browser** and a database trigger blocks early reopening. From the reopen date you record how it feels now, what happened and what changed, and see THEN and NOW side by side
- **Overthinking Fingerprint** (`/patterns`, 30 or 90 days): a radar of seven kinds of thinking, frequency, trend against the previous period, related triggers, related thoughts and a weekly timeline. Wording is always "your recent entries show more activity around…", never "you have…"
- **Hidden Trigger Detector**: triggers you noted more than once, and broader contexts (uncertainty, being evaluated, time pressure…) that recur in your own wording, each with the words it is based on
- **Dashboard with real data**: thoughts this week, loops detected, predictions pending and reviewed, worry capsules, completed actions, weekly chart, traffic-light mix, pattern snapshot, today's action, and the signature **Your MindLoop** widget (Trigger → Thought → Pattern → Action)
- Two new tables with RLS: `predictions`, `worry_capsules`. **No new dependencies**: the charts are plain HTML/CSS/SVG

### Phase 4 — Decision Room, AI and Insights

- **Decision Room** (`/decisions`, `/decisions/[id]`): lay a choice out as columns of options. Every option carries Benefits, Concerns, Known Facts, Unknowns, What I Can Control and a First Step. A new board starts with **Option A**, **Option B** and **Wait**; rename, add (up to 6) or remove them freely. The app never ranks or recommends an option
- **AI Thought Analyst**: inside the Thought step of the wizard, "Analyze with AI" returns a structured, hedged read of the entry (possible assumptions, observable facts, reflection questions, possible loop indicators, one small action). Every suggestion is editable and individually toggled off before anything is applied; nothing is saved automatically. Wording is deliberately uncertain ("One possible interpretation…") and the analyst is instructed to never diagnose, claim certainty, or act as a therapist
- **Configurable, replaceable AI layer** (`lib/ai/`): `ThoughtAnalyst` is a small interface with one method. `MockThoughtAnalyst` is the default — it runs the same deterministic pattern/context detectors as the Patterns page, so the app is fully useful with **no API key**. `OpenAiThoughtAnalyst` talks to any OpenAI-compatible `/chat/completions` endpoint; swapping providers means adding one class and one line in `lib/ai/index.ts`, no UI changes
- **Advanced Insights** (`/insights`): weekly overview (thoughts, loop frequency, actions completed, predictions reviewed, capsules reviewed), an entries-per-week chart, traffic-light mix, common triggers, common patterns, prediction reality and action completion, all switchable across **7 / 30 / 90 days**. A "What did you learn about your thinking this week?" reflection is saved in your own words, one per week
- **Export My Reflection** (`/report`): a clean, print-ready report of the same data outside the app shell, opened in a new tab. "Print or save as PDF" uses the browser's own print dialog — no PDF library, no server rendering step, and it only ever reads the signed-in user's own rows
- Three new tables, all with RLS: `decision_rooms`, `decision_options`, `reflections`. **No new dependencies**

## 1. Install

```bash
npm install
```

No new dependencies were added in Phase 2, Phase 3 or Phase 4.

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project, and wait for it to finish provisioning.
2. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.

## 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API > anon public key |
| `NEXT_PUBLIC_SITE_URL` (optional) | `http://localhost:3000` locally, your domain in production |

The service-role key is **not** used and must never be placed in a `NEXT_PUBLIC_` variable.

## 4. Run the database migrations

Run them **in filename order**:

1. `supabase/migrations/20260919000000_create_profiles.sql`
2. `supabase/migrations/20260920000000_create_thought_lab.sql`
3. `supabase/migrations/20260921000000_create_signature_features.sql`
4. `supabase/migrations/20260922000000_create_decision_room_and_insights.sql`

Either paste each file into **Supabase Dashboard > SQL Editor** and run it, or use the CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Each migration depends on functions created by the one before it (`public.set_updated_at()` from Phase 1, `public.owns_thought()` from Phase 2). All files are safe to re-run.

## 5. Configure the AI Thought Analyst (optional)

MindLoop Lab works fully with no AI key: `lib/ai/index.ts` falls back to `MockThoughtAnalyst`, which reuses the same pattern detectors as the Patterns page. To use a real model instead, add to `.env.local`:

```bash
OPENAI_API_KEY=sk-...
# Optional overrides — sensible defaults are used if you leave these blank:
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini
# AI_TIMEOUT_MS=20000
```

Set `AI_PROVIDER=mock` to force the local analyst even with a key present (useful for demos or tests). None of these variables start with `NEXT_PUBLIC_`, so the key is only ever read on the server, inside the `analyzeThought` Server Action.

## 6. Configure Supabase Auth URLs

In **Authentication > URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

**Email confirmation** is on by default. For quick local testing you can switch it off in **Authentication > Providers > Email > Confirm email**.

Password-reset and confirmation links must be opened **in the same browser** that requested them (this is how PKCE keeps them secure).

## 7. Start the app

```bash
npm run dev
```

Useful checks: `npm run lint` and `npm run typecheck`.

## Phase 4 acceptance checklist

- [ ] `/decisions` empty state, then creating a decision lands you on its board with **Option A**, **Option B** and **Wait** already there
- [ ] Editing an option's six sections and First Step saves, and the read-only view reflects it after leaving edit mode
- [ ] Adding a 4th option works; the board stops offering "Add another option" at 6; deleting an option is blocked when only one remains
- [ ] Nowhere on `/decisions/[id]` does the app suggest or highlight a "best" option
- [ ] In the Thought wizard's **Thought** step, "Analyze with AI" is disabled under 20 characters, then returns suggestions with `On-device patterns` as the provider (with no `OPENAI_API_KEY` set)
- [ ] Every AI suggestion can be edited, unticked, or removed before "Apply what I kept"; applying only adds what was kept, into Facts, Story, Trigger and Next Action, without overwriting a trigger or action you already wrote
- [ ] Setting a valid `OPENAI_API_KEY` switches the provider badge to the model name; removing it falls back to the mock without any error
- [ ] `/insights` empty state with no entries; 7/30/90-day tabs change every chart and list; the weekly reflection saves and reappears after a refresh
- [ ] `/report?range=30` (and 7, 90) opens a printable page with no sidebar; "Print or save as PDF" opens the browser dialog; the figures match `/insights` for the same range
- [ ] Signed in as a second account, `/report` and `/insights` show that account's own data only, never the first account's

### Checking Decision Room and Insights RLS yourself

Copy a decision id from account A, sign in as account B and open `/decisions/<that id>`: the 404 page, not the board. `/report` and `/insights` take no id from the URL at all — they are always the signed-in user's own data, so there is nothing to substitute.

## Phase 3 acceptance checklist

- [ ] `/thoughts/[id]` shows the loop map; clicking each of the five steps shows what you wrote for it, and it works with the keyboard and at 375px wide
- [ ] `/predictions`: saving a prediction lists it under **Waiting** with its review date. Once the date arrives it moves to **Ready to review**; recording an outcome shows the comparison and updates the tally. (To test quickly, set the expected date to today.)
- [ ] `/worry-capsules`: a new capsule appears under **Sealed** showing only the title and date. In the browser dev tools, the page payload contains neither the thought text nor the intensity
- [ ] A capsule created for "tomorrow" stays sealed today; once its date arrives it appears under **Ready to open**, and saving moves it to **Opened** with THEN and NOW
- [ ] `/patterns` empty state before you have entries; after a few entries the fingerprint, timeline, trigger cards and the 30 / 90 day switch fill in
- [ ] The dashboard shows no "Sample data" labels, and every number matches what you created
- [ ] Deleting a thought also removes its predictions and capsules

### Checking the capsule lock yourself

The lock is not just a hidden button. With your own session you can try `update worry_capsules set reopened_at = now(), current_intensity = 3 where id = '<id>'` on a capsule whose date is in the future: the trigger `worry_capsules_enforce_lock` rejects it.

## Phase 2 acceptance checklist

- [ ] `/thoughts` shows an empty state with a link to the new-thought flow
- [ ] `/thoughts/new` walks through all eight steps; Continue is blocked with a clear message when a step is incomplete
- [ ] Refresh mid-flow: your answers come back, with a "Start fresh" option
- [ ] **Save Thought** lands you on the detail page, and rows appear in `thoughts`, `thought_facts`, `thought_stories`, `emotions`, `control_items` and `actions`
- [ ] The list card shows the traffic light, status and next action
- [ ] Search, category filter and status filter narrow the list; pagination appears past nine thoughts
- [ ] Edit changes the saved analysis; completed actions are left alone
- [ ] Mark resolved, Archive and Unarchive update the status
- [ ] Delete asks for confirmation, then the thought and its child rows are gone
- [ ] Ticking the next action strikes it through and records the date
- [ ] Everything works at 375px wide, and in dark mode

### Checking RLS yourself

With two accounts, copy a thought id from account A, sign in as account B and open `/thoughts/<that id>`: you get the 404 page, not the thought. The same is true at the API level, because access is decided by Postgres policies rather than by the UI.

## Project structure

```
app/
  (auth)/              login, signup, forgot-password, reset-password
  (app)/               protected pages that share the app shell
    thoughts/          list, new, [id], [id]/edit
    patterns/          Overthinking Fingerprint and Hidden Trigger Detector
    predictions/       Prediction vs Reality
    worry-capsules/    Worry Time Capsule
    decisions/         Decision Room: list, [id]
    insights/          Advanced Insights
  (print)/
    report/            Export My Reflection — outside the app shell, printable
  auth/callback/       exchanges email-link codes for a session
components/
  ui/                  shadcn-style primitives (button, input, card, sheet, dialog, select...)
  auth/ forms/         auth forms and reusable form fields
  layout/              app shell, sidebar, header, page header
  shared/              traffic light badge, empty state, confirm dialog
  thoughts/            wizard, steps/, cards, filters, detail toolbar
  loop/                Thought Loop Map
  predictions/ capsules/ patterns/   feature components
  decisions/           board, option card, room cards, new-room form
  insights/            range tabs, reflection form, prediction/action cards, top list
  ai/                  the editable "Analyze with AI" panel
  charts/              dependency-free bar, mini-bar and stacked-bar charts
  dashboard/           dashboard cards and the "Your MindLoop" widget
hooks/                 client hooks (useSignOut, useThoughtDraft)
lib/
  supabase/            browser, server and middleware clients
  auth/                session helpers, error messages, safe redirects
  constants/           routes, navigation, thought-lab domain values
  thoughts/            queries, server actions, draft model, wizard logic
  pattern-detector.ts  deterministic pattern detection (pure TypeScript, no UI or database)
  trigger-detector.ts  deterministic trigger detection (same design)
  patterns/ dashboard/ predictions/ capsules/ loop/   server queries, actions and pure helpers
  decisions/           queries and Server Actions for rooms and options
  insights/            aggregation queries, the weekly-range helper, reflection actions
  ai/                  provider contract, prompt, schema, mock + OpenAI providers, rate limit
  validations/         zod schemas
supabase/migrations/   SQL migrations
types/  utils/         shared types, date and text helpers
```

## Notes on the Phase 2 design

- **Where the logic lives.** Step definitions and validation are in `lib/thoughts/wizard.ts`, the draft shape in `lib/thoughts/draft.ts`, and reads/writes in `lib/thoughts/queries.ts` and `lib/thoughts/actions.ts`. The step components only render.
- **Writes are Server Actions.** They re-check the session, validate the whole payload with zod, and let RLS enforce ownership. PostgREST cannot span tables in one transaction, so `createThought` deletes the parent row if a child insert fails rather than leaving a half-saved thought.
- **Editing rewrites the child rows.** They are small unordered lists, so a rewrite is more predictable than a diff. Completed actions are preserved as history.
- **Drafts are local only.** An unfinished analysis lives in `localStorage` under `mindloop:thought-draft:*` and is cleared on save. Nothing partial is stored on the server.
- **Wording.** The traffic light and the emotion scale describe one entry in the user's own words. No diagnostic or clinical language is used anywhere.

## Notes on the Phase 3 design

- **Detection is deterministic and replaceable.** `lib/pattern-detector.ts` and `lib/trigger-detector.ts` are plain TypeScript. They take a list of flattened entries and return a report (`PatternReport`, `TriggerReport`). To use a smarter detector later, return the same shapes; no component changes. The word lists at the top of each file are the tuning knobs
- **Every result is explainable.** A thought is linked to a pattern only when specific words match, and those words are shown on the card. A "loop" means an entry marked red, or one whose trigger appears on 3 or more entries in the period
- **Raw text stays on the server.** The detectors run in server code; the browser receives counts, labels and thought titles. Dashboard counts use `head: true` queries, so Postgres returns numbers, not rows. Locked capsules never include their text or intensity in the response
- **Sealing is enforced twice.** The server action refuses an early reopen, and a Postgres trigger refuses it even for someone calling the API directly. A capsule's sealed fields (thought, original intensity) cannot be edited, and a reopened capsule is final. The lock applies to the capsule; the thought itself remains visible in the Thought Lab, because it is your own entry
- **Days are UTC.** "Today", review dates and capsule dates use the UTC calendar, the same one the database uses, so a capsule opens at the start of the UTC day. Server actions allow one day of slack for prediction dates
- **Outcome wording is neutral.** The four outcomes carry four different colours plus text labels, and nothing is described as good or bad. Trend wording is "more" or "less", never "worse"

## Notes on the Phase 4 design

- **The AI layer is one interface.** `ThoughtAnalyst` (`lib/ai/types.ts`) has a single `analyze()` method. `lib/ai/index.ts` is the only place that decides which implementation runs, based on environment variables; every component and Server Action depends on the interface, never on a provider class
- **Nothing from AI is trusted blindly.** `lib/ai/schema.ts` re-parses whatever any provider returns — trimming whitespace, capping list length and item length, dropping non-string entries — before the UI ever sees it. A provider returning malformed or oversized JSON degrades gracefully instead of breaking the panel
- **Suggestions are never auto-saved.** `analyzeThought` is a read-only Server Action: it returns an analysis and writes nothing. The panel keeps its own local state until "Apply what I kept" merges the user's edited, individually-approved lines into the wizard's draft — the same draft the rest of the wizard already uses
- **The prompt encodes the safety rules once.** `lib/ai/prompt.ts` is the single place that tells the model to hedge, to stay in facts-versus-assumptions, to never diagnose or claim certainty, and to hand off to the user's own support network if the text suggests crisis. `AI_DISCLAIMER` is shown next to every result in the UI, and both files are meant to be read together when auditing behaviour
- **Decision Room stores lists as arrays.** The six sections on an option are short, unordered and always read and written as a whole, so `decision_options` keeps them as `text[]` columns rather than five more child tables — with the same length caps enforced in Postgres as in the UI
- **The report reuses `getInsights()`.** `/report` is a plain server-rendered page with no client JavaScript beyond the Print button; it calls the exact same query the Insights page does, so the two can never disagree, and takes no id from the URL, so there is nothing for one user to point at another's data with

## Security notes

- Only the public anon key reaches the browser. Access control is enforced by Postgres RLS, not by the UI.
- Child tables (`thought_facts`, `thought_stories`, `emotions`, `control_items`, `decision_options`) inherit ownership through `public.owns_thought()` / `public.owns_decision_room()`; `actions`, `predictions` and `worry_capsules` are checked on both `user_id` and the parent thought.
- The AI key (when set) lives in a server-only environment variable and is read only inside `lib/ai/openai-analyst.ts`, called from a Server Action. It is never sent to, or readable from, the browser.
- Every list and detail query filters by `user_id` as well, so a policy change can never silently widen a query.
- The middleware validates the session with `supabase.auth.getUser()` on every request, and protected layouts re-check on the server.

MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.

## Phase 5 — Final polish and production

### What's new

- **Public landing page at `/`** — previously `/` only redirected to `/login` or `/dashboard`. It now shows a real
  marketing page (hero, signature flow, feature grid, CTA, footer disclaimer) and still sends signed-in users
  straight to their dashboard via the primary button.
- **Settings, expanded** — `/settings` now has four sections: Profile (Phase 1), Preferences (theme + an email
  notification toggle backed by a new `profiles.notifications_enabled` column), Privacy (a plain-language summary of
  what's stored and why), and Account (log out, plus "Delete account" behind a type-to-confirm dialog).
- **Account deletion** — `lib/settings/actions.ts` → `deleteAccount()` calls the Supabase Admin API to delete the
  auth user. Every product table cascades from `auth.users`, so this removes all of a user's thoughts, predictions,
  capsules, decisions and insights along with it. This is the one place the app uses the service-role key — see
  `lib/supabase/admin.ts`, which is `server-only` so it can never be bundled into client code.
- **SEO** — `app/robots.ts` and `app/sitemap.ts` (Next.js's typed metadata routes, served at `/robots.txt` and
  `/sitemap.xml`), plus Open Graph and Twitter card metadata in the root layout. The favicon (`app/icon.svg`) and
  the Open Graph share image (`app/opengraph-image.tsx`) and Apple touch icon (`app/apple-icon.tsx`) are all the
  same loop-mark design, kept as code (SVG / `next/og`) rather than uploaded image files, so there's nothing in
  `public/` to keep in sync when the brand mark changes.
- **Root-level error boundary** — `app/global-error.tsx` catches errors thrown by the root layout itself, which
  `app/(app)/error.tsx` cannot (that one only covers the authenticated app shell).

### One more environment variable

Account deletion needs the Supabase **service-role** key, which none of the earlier phases required:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find it in **Supabase Dashboard → Project Settings → API → service_role key**. Keep it out of version control and
never prefix it with `NEXT_PUBLIC_` — it must stay server-only. Every other feature, including the rest of Settings,
works without it.

### One more migration

```bash
npx supabase db push
```

picks up `20260923000000_add_notification_preference.sql`, which adds `notifications_enabled boolean not null
default true` to `profiles`. It's additive and safe to run on top of an existing Phase 1–4 database.

### Deploying to Vercel

1. Push the repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, **Add New → Project**, import the repository, and keep the default Next.js build settings.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (needed for account deletion)
   - `NEXT_PUBLIC_SITE_URL` — set this to your production URL (e.g. `https://mindlooplab.vercel.app`); it feeds the
     canonical URL, Open Graph tags, `robots.txt` and `sitemap.xml`
   - `AI_PROVIDER`, `OPENAI_API_KEY`, and friends, if you're using real AI analysis (optional — the app runs fine
     with the mock analyst)
4. Deploy. Then in **Supabase Dashboard → Authentication → URL Configuration**, add your Vercel URL as a **Site URL**
   and to **Redirect URLs** — otherwise password-reset and signup-confirmation links will point back at `localhost`.
5. Re-run `npx supabase db push` against the production project if you created a separate Supabase project for
   production rather than reusing the one from local development.

### Manual QA pass

There's no CI in this repository, so before shipping a change, check by hand:

- `npm run lint` and `npx tsc --noEmit` both pass.
- `npm run build` completes with no errors.
- Signup → login → logout → forgot/reset password all work.
- A second test account can't see the first account's thoughts, predictions, capsules, decisions or settings.
- The app is usable at 320px, 375px, 768px and 1024px widths, and at normal desktop width.
- Both the light and dark themes render every page without contrast issues.
- `/settings` → Delete account correctly requires typing `DELETE`, then signs the account out and removes its data.
