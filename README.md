# ASA Traders Dashboard

Green cardamom consignment, profit and accounts dashboard — React 19 + Vite + Tailwind CSS v4.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

## Deploy to Vercel

The app is a static single-page app: `vite build` outputs plain HTML/CSS/JS to `dist/`,
which Vercel serves from its CDN — no serverless functions are needed. `vercel.json`
sets the build, SPA fallback, immutable caching for hashed `/assets/*`, and security headers.

- **Dashboard:** import the repo at vercel.com/new — settings are picked up from `vercel.json`.
- **CLI:** `npx vercel` (preview) / `npx vercel --prod` (production).

## Project layout

```
index.html            Vite entry (fonts, favicon)
public/               Static files copied as-is to the site root (favicon.svg)
src/
  main.jsx            React root
  App.jsx             Layout + view switch
  index.css           Tailwind import + design tokens (@theme)
  state/AppContext    App state, persistence, shared actions
  lib/                Pure logic: calc, selectors, storage/seed, reports, formatting
  components/         UI primitives, header, modals, tooltip
    dashboard/        Dashboard charts & tables
    entry/            Consignment entry steps, profit summary, price simulator
  views/              Dashboard, Consignments, FixedCosts, Accounts
legacy/               Original single-file version (not deployed)
```

## Notes

- **Styling:** all UI styling is Tailwind utilities. Colours/fonts are tokens in `src/index.css`
  (`bg-card`, `text-muted`, `font-heading`, …). The only inline `style` values are data-driven
  (bar heights/positions, tooltip coordinates, donut gradient, category colours).
- **Data** is stored in the browser's `localStorage` (key `asa-traders-v1`), same as the original —
  existing saved data loads unchanged. It is per-browser/device; there is no backend.
- **PDF export** uses `html2pdf.js`, code-split so it only downloads on first export.
