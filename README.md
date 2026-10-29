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
