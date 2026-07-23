# Volunteer Hub

A lightweight, zero-dependency web app for managing 30–50 volunteers. Track profiles, log hours, and reward dedication with a swag tier system.

## Features

- **Dashboard** — metrics, top volunteers, upcoming birthdays/anniversaries, recent activity
- **Volunteer profiles** — contact info, favorites, important dates, notes
- **Hour logging** — single or bulk entry in seconds
- **Swag Vault** — customizable reward tiers unlocked by cumulative hours
- **Export** — download all data as JSON anytime

## Getting started

No build step needed. Just open `index.html` in a browser, or deploy to any static host.

```bash
# Option 1: open locally
open index.html

# Option 2: serve locally
npx serve .
# or
python3 -m http.server 8080
```

## Deploying

### GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Your app will be live at `https://<your-username>.github.io/<repo-name>`

### Netlify
Drag and drop the project folder at [app.netlify.com/drop](https://app.netlify.com/drop) — live in seconds.

### Vercel
```bash
npx vercel
```

## Storage

Data is stored in `localStorage` by default — it persists in the same browser but is not shared across devices.

To add shared/cloud storage, replace the `loadState()` and `saveState()` functions in `app.js` with calls to a backend such as Supabase, Firebase, or your own API.

## Customizing swag tiers

Open the app → **Swag Vault → Edit rewards** to change item names, emojis, descriptions, and hour thresholds without touching code.

## File structure

```
volunteer-hub/
├── index.html   # markup and page structure
├── style.css    # all styles
├── app.js       # all logic and state
└── README.md
```

## License

MIT
