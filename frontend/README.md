# CardMaster Enclave — Frontend

React 18 + TypeScript + Vite + MUI app for the CardMaster Enclave community website and resident maintenance portal. The stack matches the project TRD.

## Prerequisites

- **Node.js 18+** and npm. Install from https://nodejs.org/ (LTS) — Node is not currently installed on this machine.
- Verify after install:
  ```powershell
  node --version
  npm --version
  ```

## Run locally

From the `frontend/` folder:

```powershell
npm install
npm run dev
```

The dev server opens at http://localhost:5173.

## Build for production

```powershell
npm run build
npm run preview
```

## What's in place

- **`/` (Home)** — public landing page with: Hero (slideshow), About, Amenities (12 icons), Gallery (lightbox), Location (map + nearby), Contact (form), Footer.
- **`/login`** — placeholder that will become the resident login + dashboard.
- **Responsive Navbar** — horizontal links on desktop (≥960px), hamburger + right-side drawer on tablet/mobile, transparent over the hero and solid after scroll.
- **Theme** — gold (`#C9A961`) / dark (`#0B1426`) palette matching the CardMaster Enclave logo, Cinzel for headings + Inter for body.

## Replace the placeholder logo

The navbar/footer logo currently uses a generated SVG placeholder at:

```
src/assets/logo.svg
```

To use the real CardMaster Enclave logo:

1. Save your PNG/JPG as `src/assets/logo.png` (or `.jpg`).
2. Open `src/components/Logo.tsx`.
3. Change the import to match your file:
   ```ts
   import logo from "../assets/logo.png";
   ```

That's it — the component reuses the same image everywhere.

## Replace gallery / hero photos

All images currently use free Unsplash photos for instant visual fidelity. To swap in real community photos:

- **Hero slides** — edit `SLIDES` in `src/sections/Hero.tsx`.
- **About photo** — edit the `<img>` `src` in `src/sections/About.tsx`.
- **Gallery grid** — edit `ITEMS` in `src/sections/Gallery.tsx`.

Drop real photos into `src/assets/` and import them, or keep external URLs.

## Folder structure

```
frontend/
  src/
    assets/             # logo + future images
    components/         # Navbar, Footer, Logo, SectionHeading
    pages/              # Home, LoginPlaceholder
    sections/           # Hero, About, Amenities, Gallery, Location, Contact
    theme.ts            # MUI theme + palette
    App.tsx             # Router
    main.tsx            # Entry
  index.html
  package.json
  vite.config.ts
  tsconfig.json
```

## Next up

The next milestone is the resident dashboard (replacing `/login` with the real login flow and the role-based dashboard from the PRD/TRD — Treasurer admin, payment recording, complaints, etc.).
