# Volunteer Hub

A lightweight web app for managing 30–50 volunteers, backed by Supabase. Track profiles, log hours, and reward dedication with a swag tier system.

## Features

- **Dashboard** — metrics, top volunteers, upcoming birthdays/anniversaries, recent activity
- **Volunteer profiles** — contact info, favorites, important dates, notes
- **Hour logging** — single or bulk entry in seconds
- **Swag Vault** — customizable reward tiers unlocked by cumulative hours
- **Export** — download all data as JSON anytime
- **Auth** — email/password sign-in; staff accounts are admin-invited only, no public sign-up

## Setup

The app is a zero-build static site (`index.html` + `app.js` + `style.css`) backed by a [Supabase](https://supabase.com) project for the database and auth. You'll want **two** Supabase projects: one for development and one for production, since it's easy to switch which one the app talks to (see [Configuring which Supabase project](#configuring-which-supabase-project) below).

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema**: open the SQL Editor in the Supabase dashboard, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `volunteers`, `logs`, `swag`, and `app_settings` tables, enables Row Level Security (only signed-in users can read/write), and seeds the six default swag tiers.
3. **Invite yourself (and any staff)**: Authentication → Users → Invite user, for each person who needs access. There's no sign-up form in the app itself — accounts are admin-managed.
4. **Configure the app** to point at this project (see below).
5. Open `index.html` in a browser, or serve it locally:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```

### Configuring which Supabase project

The app reads its Supabase URL and anon key from `window.SUPABASE_CONFIG`, set in `config.js`. This file is **gitignored** — copy the template and fill in your project's values (Project Settings → API in the Supabase dashboard):

```bash
cp config.example.js config.js
```

Because `config.js` isn't committed, switching between your personal dev project and a production/nonprofit project later is just a matter of swapping the values in `config.js` (or, for a deployed site, the repo secrets — see below). No code changes needed.

## Deploying

### GitHub Pages (recommended)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds `config.js` from repo secrets and deploys to Pages on every push to `main`. One-time setup:

1. **Settings → Secrets and variables → Actions**, add:
   - `SUPABASE_URL` — your production Supabase project's URL
   - `SUPABASE_ANON_KEY` — your production Supabase project's anon key
2. **Settings → Pages → Source**, switch to **GitHub Actions**.
3. Push to `main` — the app deploys automatically to `https://<your-username>.github.io/<repo-name>`.

Since the anon key is meant to be public (access is controlled by Row Level Security + Auth, not key secrecy), it's safe for it to end up in the built, deployed page — it just never sits in git history.

### Netlify / Vercel

Since `config.js` isn't committed, a plain drag-and-drop or `npx vercel` deploy won't have it. Either add a similar build step that writes `config.js` from an environment variable, or manually place a real `config.js` in the deployed output.

## Database

Schema, RLS policies, and default swag seed data live in [`supabase/schema.sql`](supabase/schema.sql) — run it once per Supabase project (dev and prod). There's no migration tooling; if the schema changes, re-apply the updated script to both projects by hand.

Row Level Security only grants access to `authenticated` requests — anyone not signed in gets zero rows back from every table.

## Customizing swag tiers

Open the app → **Swag Vault → Edit rewards** to change item names, emojis, descriptions, and hour thresholds without touching code.

## File structure

```
volunteer-hub/
├── index.html               # markup, login screen, page structure
├── style.css                 # all styles
├── app.js                    # all logic, Supabase client, auth, rendering
├── config.example.js         # config template (committed)
├── config.js                 # your real Supabase URL/key (gitignored)
├── supabase/schema.sql       # DB schema, RLS policies, seed data
├── .github/workflows/deploy.yml  # GitHub Pages deploy
└── README.md
```

## License

MIT
