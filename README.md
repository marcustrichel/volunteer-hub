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

The app is a zero-build static site (`index.html` + `app.js` + `style.css`) backed by a [Supabase](https://supabase.com) project for the database and auth. There's no local config file — the app only runs as deployed via GitHub Pages, with its Supabase credentials injected at deploy time from a GitHub Environment (see below).

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema**: open the SQL Editor in the Supabase dashboard, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `volunteers`, `logs`, `swag`, and `app_settings` tables, enables Row Level Security (only signed-in users can read/write), and seeds the six default swag tiers.
3. **Invite yourself (and any staff)**: Authentication → Users → Invite user, for each person who needs access. There's no sign-up form in the app itself — accounts are admin-managed.
4. **Set up the deploy environment and push** (see below) — that's how the app gets its Supabase URL/anon key and becomes reachable.

## Deploying

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds `runtime-config.js` (which sets `window.SUPABASE_CONFIG`) from the **`production`** GitHub Environment's secrets and deploys to GitHub Pages on every push to `main`. One-time setup:

1. **Settings → Environments**, create an environment named `production`.
2. In that environment, add secrets:
   - `SUPABASE_URL` — your Supabase project's URL
   - `SUPABASE_ANON_KEY` — your Supabase project's anon key
3. **Settings → Pages → Source**, switch to **GitHub Actions**.
4. Push to `main` — the app deploys automatically to `https://<your-username>.github.io/<repo-name>`.

Since the anon key is meant to be public (access is controlled by Row Level Security + Auth, not key secrecy), it's safe for it to end up in the built, deployed page — it just never sits in git history.

Switching from your personal dev Supabase project to a production/nonprofit one later is just a matter of updating those two secrets on the `production` environment — no code changes needed.

There's no supported way to run the app locally against real data — it only becomes usable once deployed, since that's the only place `runtime-config.js` ever gets generated. To test a change, push it (or merge it to `main`) and check the deployed site.

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
├── .github/workflows/deploy.yml  # generates runtime-config.js from the
│                                  # "production" environment's secrets,
│                                  # deploys to Pages
└── README.md
```

## License

MIT
