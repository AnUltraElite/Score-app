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
