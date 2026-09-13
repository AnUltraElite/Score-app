# Scoreline

Live multi-sport scoring app for organisers — soccer, cricket, badminton, and volleyball. Built with React + Vite.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Deploy

This project has zero-config support for the three most common hosts:

### Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: **Vite** (auto-detected). Click Deploy.

### Netlify
1. Push this folder to a GitHub repo.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
3. Build command: `npm run build`, publish directory: `dist`. Click Deploy.
   (The `public/_redirects` file is already set up for SPA routing.)

### GitHub Pages
A workflow is already included at `.github/workflows/deploy.yml`.
1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages → Source**, select **GitHub Actions**.
3. Push to `main` — it builds and deploys automatically.
4. Your app will be live at `https://<username>.github.io/<repo-name>/`.

## Project structure

```
scoreline-app/
├── src/
│   ├── App.jsx        # entire app (screens, components, scoring logic)
│   ├── main.jsx       # React entry point
│   └── index.css      # base styles/reset
├── public/
│   └── _redirects     # Netlify SPA routing
├── index.html         # HTML entry point
├── vite.config.js
├── vercel.json         # Vercel SPA routing
├── package.json
└── .github/workflows/deploy.yml   # GitHub Pages auto-deploy
```

## Notes

- All data is currently in-memory (seeded mock matches) — nothing persists on refresh yet. Wiring to Firebase or another backend is the natural next step for real accounts, live sync between viewers, and persistence.
- Built mobile-first: bottom tab nav under 900px width, left sidebar above it.
- Settings (dark mode, profile name/bio) persist to the browser's localStorage.

## Installable PWA

Scoreline is a Progressive Web App — on Android (Chrome) and desktop Chrome/Edge, users can install it like a native app (own icon, own window, works offline for the app shell).

- A download-arrow button sits at the top right of the app. Tapping it reveals "Download the app" — tapping again triggers the browser's native install prompt.
- If dismissed, the button collapses back to just the arrow icon and will periodically re-expand on its own every ~90 seconds while the person keeps using the site, as a gentle reminder — never a blocking popup.
- The button disappears automatically once the app is installed, or if it's already running as an installed app.
- **Important**: browsers only show the install prompt over **HTTPS** (or `localhost` during development) and only after their own installability checks pass (valid manifest, registered service worker, icons present) — all of which are already wired up in `public/manifest.json`, `public/service-worker.js`, and `index.html`. Vercel, Netlify, and GitHub Pages all serve over HTTPS by default, so this works out of the box once deployed.
- iOS Safari does not support the `beforeinstallprompt` API (an Apple/WebKit limitation, not something fixable from this app) — iPhone users can still install via Share → "Add to Home Screen", just without the in-app prompt button doing it for them.
