# YNK Air Traffic icons

These PNGs are generated from `scripts/generate-brand-assets.mjs`.

- `icon-192.png` and `icon-512.png` are the installed web icons.
- `apple-touch-icon.png` is the home-screen icon for Safari.
- The 1024 marketing icon and the native launch images live in `assets/` and `docs/app-store/`.

Regenerate with `npm run assets:brand`, then `npx @capacitor/assets generate --ios --android` after the native projects exist.
