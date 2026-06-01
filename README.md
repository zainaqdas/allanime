# KaiStream 🐉

**KaiStream** is a self-hosted web application for browsing and streaming anime episodes. It serves as a clean, modern frontend client for the AllAnime GraphQL API, with a built-in proxy that handles authentication, decryption, and caching.

Named after **Kai** — the sea dragon mascot who guides you through your anime streaming experience.

## Features

- **Browse Anime** — Explore trending, popular, and recently updated shows with sorting and genre filtering
- **Search** — Debounced search with autocomplete suggestions for quick navigation
- **Show Details** — View show metadata, score, status, genres, episode list, and characters
- **Video Player** — Stream episodes with HLS.js support, iframe embedding, and direct video fallback
- **Source Selection** — Switch between multiple stream sources per episode
- **Continue Watching** — Persistent watch progress saved to localStorage
- **Keyboard Shortcuts** — Arrow keys for prev/next episode, F for fullscreen, M for mute
- **Infinite Scroll** — Pageless browsing on the home page
- **Dark/Light Theme** — Toggle between dark (default) and light mode, persisted across sessions
- **Responsive Design** — Works on desktop and mobile with a glassmorphism UI
- **Kai Mascot** — Custom SVG sea dragon character throughout the UI

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + CSS custom properties |
| **HTTP Client** | [Axios](https://axios-http.com/) (server-side), native `fetch` (client-side) |
| **Video Playback** | [HLS.js](https://github.com/video-dev/hls.js/) (dynamic import) |
| **Video Decryption** | Node.js `crypto` (AES-256-CTR) |
| **Runtime** | Node.js 18+ |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd kaistream

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server on port 3000 |
| `npm run lint` | Lint with Next.js ESLint config |

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Homepage (Suspense + skeleton loading)
│   ├── layout.tsx              # Root layout (Navbar, ThemeProvider)
│   ├── loading.tsx             # Global loading state (Kai mascot SVG)
│   ├── globals.css             # Tailwind + CSS variables + utilities
│   ├── show/[id]/page.tsx      # Show detail page
│   ├── watch/[id]/[ep]/page.tsx # Video player page
│   └── api/[...path]/route.js  # Catch-all API proxy route
├── components/                 # Reusable React components
│   ├── Navbar.tsx              # Header with search + theme toggle
│   ├── HomePageContent.tsx     # Main browse/search page
│   ├── ShowCard.tsx            # Show thumbnail card
│   ├── EpisodeGrid.tsx         # Episode grid/list view
│   ├── VideoPlayer.tsx         # Video player with HLS/iframe support
│   ├── SourceSelector.tsx      # Video source switcher
│   └── Characters.tsx          # Characters display
├── lib/                        # Core logic
│   ├── api.ts                  # Client-side API client
│   ├── api-server.js           # Server-side AllAnime GraphQL proxy
│   ├── cache.js                # In-memory TTL cache
│   ├── decrypt.js              # AES-256-CTR decryption for video URLs
│   ├── ThemeProvider.tsx       # Dark/light theme context
│   └── useContinueWatching.ts  # localStorage-based watch progress
└── types/
    └── index.ts                # TypeScript interfaces
```

## Architecture

### API Proxy Flow

```
Browser  ──[fetch]──→  Next.js API Route (/api/*)
                           │
                     [Axios POST]
                           │
                           ▼
               AllAnime GraphQL API
               (api.allanime.day)
                           │
                     [Response]
                           │
                           ▼
              ┌─────────────────────┐
              │  In-Memory Cache    │
              │  (TTL-based)        │
              └─────────────────────┘
                           │
                     [Decryption]
                  (AES-256-CTR)
                           │
                           ▼
              ┌─────────────────────┐
              │  Browser Response   │
              │  (JSON)             │
              └─────────────────────┘
```

All GraphQL calls happen **server-side**, so encryption keys and API logic are never exposed to the client. The Next.js API route at `src/app/api/[...path]/route.js` acts as a proxy, dispatching requests to the appropriate server-side handler in `api-server.js`.

### Video Source Decryption

KaiStream uses a reverse-engineered decryption process (based on the [ani-cli](https://github.com/pystardust/ani-cli) project) to extract video source URLs from the AllAnime API:

1. The API returns encrypted payloads prefixed with `tobeparsed`
2. Payloads are decrypted using AES-256-CTR with a key derived from SHA-256 of a known string
3. Decrypted JSON is parsed to extract `sourceName` / `sourceUrl` pairs
4. Sources are ranked and presented in the SourceSelector component

### Caching

Responses are cached in memory using a `Map`-based cache with configurable TTLs:

| Data Type | TTL |
|---|---|
| Shows / Search | 5 minutes |
| Show details | 10 minutes |
| Episode lists | 10 minutes |
| Stream Sources | 2 minutes |
| Popular / Recommendations | 10 minutes |
| Categories / Genres | 1 hour |

## API Endpoints

All endpoints are proxied through `GET /api/*`.

| Endpoint | Description |
|---|---|
| `GET /api/shows` | Paginated show listing with filters |
| `GET /api/shows/:id` | Single show details |
| `GET /api/shows/:id/episodes` | Episode list for a show |
| `GET /api/shows/:id/streams/:ep` | Stream sources for an episode |
| `GET /api/search?q=` | Search anime by query |
| `GET /api/popular` | Trending/popular anime |
| `GET /api/recommendations` | Anime recommendations |
| `GET /api/characters?showId=` | Characters for a show |
| `GET /api/genres` | Available genre list |
| `GET /api/categories` | Filter categories |
| `GET /api/health` | Health check |

### Query Parameters for `/api/shows`

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `sortBy` | string | Sort field (Trending, Popular, Latest_Update, Name_ASC, etc.) |
| `genres` | string | Comma-separated genre filter |
| `season` | string | Season filter (WINTER, SPRING, SUMMER, FALL) |
| `year` | number | Year filter |
| `translationType` | string | sub, dub, or raw |
| `status` | string | 0=Finished, 1=Releasing, 2=Not yet aired |

## Keyboard Shortcuts

On the watch page:

| Key | Action |
|---|---|
| `←` / `→` | Previous / Next episode |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Esc` | Close episode sidebar |

## Theming

The project uses a custom dark green color palette with CSS custom properties. Light mode is toggled by adding the `.light-theme` class to the `<html>` element. The theme preference is persisted in `localStorage` under the key `kaistream_theme`.

### Color Tokens

| Token | Dark | Light |
|---|---|---|
| `--bg-primary` | `#050805` | `#f0faf0` |
| `--bg-card` | `#0f1a0f` | `#ffffff` |
| `--text-primary` | `#f0fdf0` | `#0a1a0a` |
| `--accent-1` | `#10b981` | `#059669` |

## Deployment

Build for production:

```bash
npm run build
npm start
```

The production server runs on port 3000 by default. You can change the port:

```bash
npm start -- -p 8080
```

### Environment

No environment variables are required. The AllAnime API URL, embed bases, and decryption key are hardcoded (but can be modified in `src/lib/api-server.js` and `src/lib/decrypt.js`).

## Acknowledgments

- [ani-cli](https://github.com/pystardust/ani-cli) — Reverse-engineered AllAnime API and decryption logic
- [AllAnime](https://allanime.day) — Content source
- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [HLS.js](https://github.com/video-dev/hls.js/) — HLS video playback
