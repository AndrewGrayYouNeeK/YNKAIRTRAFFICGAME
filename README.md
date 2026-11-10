# Air Traffic Control Game

A real-time air traffic control and drone detection simulation built with React and Vite.

## Features

- Live radar scanner with drone detection
- Air traffic control simulation with voice commands
- Watchlist, incidents, analytics, and detection history
- Local-first data storage (no external backend required)

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Tech Stack

- React 18
- Vite
- TanStack Query
- Tailwind CSS
- Recharts / Leaflet

Airport unlocks, session scores, detection history, and the tutorial choice are stored in the browser with localStorage. The app does not require an account or login, and it runs fully offline after the first load.

## iPhone app

The same build ships as a native app named **YNK Air Traffic**, bundle id `com.youneek.airtraffic`. Open `ios/App/App.xcodeproj` on a Mac after `npm run ios:sync`. Signing, TestFlight, and App Store submission are Andrew's steps, written in [RELEASE.md](RELEASE.md). The store listing copy is in [docs/APP_STORE.md](docs/APP_STORE.md). The privacy policy is [PRIVACY.md](PRIVACY.md) and [public/privacy.html](public/privacy.html).

An Android project is generated alongside iOS. The App Store build is the one that matters.
