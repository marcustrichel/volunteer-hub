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

The app is a zero-build static site (`index.html` + `app.js` + `style.css`) backed by a [Supabase](https://supabase.com) project for the database and auth.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema**: open the SQL Editor in the Supabase dashboard, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `volunteers`, `logs`, `swag`, and `app_settings` tables, enables Row Level Security (only signed-in users can read/write), and seeds the six default swag tiers.
3. **Invite yourself (and any staff)**: Authentication → Users → Invite user, for each person who needs access. There's no sign-up form in the app itself — accounts are admin-managed.
4. **Set the Supabase URL/anon key** — see below.

> **⚠️ Temporary state**: the Supabase URL and anon key are currently hardcoded directly in `index.html` (see the TODO comment there), not injected from secrets. This was a deliberate stopgap to unblock deployment after GitHub Pages stopped serving a runtime-generated/substituted config file for reasons that weren't fully diagnosed. It means **switching Supabase projects (e.g. dev → nonprofit prod) currently requires editing and committing `index.html`**, not just updating a secret. The intended design — GitHub Environment secrets substituted into `index.html` at deploy time, so swapping projects is just updating secrets — is preserved in git history (see the "Deploying" commits) and should be restored once the Pages issue is understood.

## Deploying

A GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to GitHub Pages on every push to `main`. One-time setup:

1. **Settings → Pages → Source**, switch to **GitHub Actions**.
2. Push to `main` — the app deploys automatically to `https://<your-username>.github.io/<repo-name>`.

Since the anon key is meant to be public (access is controlled by Row Level Security + Auth, not key secrecy), hardcoding it in the deployed page isn't a security problem by itself — the issue is purely that it's no longer easy to swap per environment (see the warning above).

## Database

Schema, RLS policies, and default swag seed data live in [`supabase/schema.sql`](supabase/schema.sql) — run it once per Supabase project you use. There's no migration tooling; if the schema changes, re-apply the updated script by hand.

Row Level Security only grants access to `authenticated` requests — anyone not signed in gets zero rows back from every table.

## Customizing swag tiers

Open the app → **Swag Vault → Edit rewards** to change item names, emojis, descriptions, and hour thresholds without touching code.

## File structure

```
volunteer-hub/
├── index.html               # markup, login screen, page structure
├── style.css                 # all styles
├── app.js                    # all logic, Supabase client, auth, rendering
├── supabase/schema.sql       # DB schema, RLS policies, seed data
├── .github/workflows/deploy.yml  # deploys to Pages
└── README.md
```

## License

MIT
