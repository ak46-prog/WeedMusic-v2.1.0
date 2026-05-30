# WeedMusic v2.1.0

**Ad-free music streaming app with YouTube integration** — JioSaavn-style UI built with Next.js 16, enhanced with Firebase Auth, Cloud Sync & Multi-Layer Audio Streaming

<p align="center">
  <a href="https://ak46-prog.github.io/WEEDMUSIC/">
    <img src="https://img.shields.io/badge/LAUNCH_PLAYER-Open_Now-orange?style=for-the-badge&logo=music" alt="Launch WeedMusic Player" />
  </a>
  <img src="https://img.shields.io/badge/Version-2.1.0-blue?style=for-the-badge" alt="v2.1.0" />
  <img src="https://img.shields.io/badge/Cost-$0-green?style=for-the-badge" alt="Free" />
  <img src="https://img.shields.io/badge/Firebase-Enhanced-blueviolet?style=for-the-badge" alt="Firebase Enhanced" />
</p>

---

## What's New in v2.1.0

- **Fixed: Music Loading** — Trending section now returns actual music tracks instead of news/livestreams
- **Fixed: Song Playback** — Multi-layer audio streaming with 4 fallback layers for reliable playback
- **Fixed: Sound Issues** — Increased proxy timeouts, Invidious fallback chain, and seamless YouTube IFrame fallback
- **Added: Piped Stream Layer** — New Layer 4 audio resolver via Piped API for more streaming sources
- **Added: Music Content Filtering** — Filters out livestreams, very short clips, and non-music content
- **Added: Staging CI/CD** — GitHub Actions with proper staging/production deployment pipelines

---

## Features

- **YouTube Music Streaming** — Search & play millions of songs via YouTube
- **4-Layer Audio Streaming** — ytdl-core → InnerTube → Invidious → Piped (automatic fallback)
- **Google Authentication** — Sign in with Google via Firebase (optional)
- **Cloud Playlist Sync** — Cross-device sync via Firebase Realtime Database (optional)
- **Video Playback** — Watch music videos with adjustable quality (420p+)
- **Ad-Free Listening** — No interruptions, pure music
- **Dark Theme** — Easy on the eyes with dark/light mode toggle
- **Voice Search** — Search songs using your voice
- **Trending Music** — Discover what's hot right now (actual music only)
- **Responsive Design** — Works on mobile, tablet & desktop
- **Car Mode** — Simplified UI for driving
- **Kids Mode** — Family-friendly interface
- **EQ Controls** — Bass & treble adjustment
- **Auto-Play Queue** — Seamless listening experience
- **PWA Support** — Install as a native app
- **Works Offline** — Full functionality without Firebase

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Prisma ORM** | Database management (SQLite) |
| **Firebase Auth** | Google sign-in (optional) |
| **Firebase RTDB** | Cloud playlist sync (optional) |
| **Zustand** | State management |
| **ytdl-core** | YouTube stream resolution (Layer 1) |
| **InnerTube API** | YouTube data & streaming (Layer 2) |
| **Invidious API** | YouTube stream fallback (Layer 3) |
| **Piped API** | YouTube stream fallback (Layer 4) |
| **Web Audio API** | Volume normalization & EQ |
| **MediaSession API** | Lock screen controls |

## Branching Strategy (Staging Convention)

| Branch | Purpose | Auto-Deploy |
|--------|---------|-------------|
| `main` | Production releases | Vercel Production |
| `staging` | Pre-production testing | Vercel Staging |
| `develop` | Active development | Vercel Preview |
| `release/**` | Release preparation | Build only |
| `hotfix/**` | Emergency fixes | Build + Deploy to Production |
| `feature/**` | Feature branches | Build only |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ak46-prog/WEEDM2.0.1.git
cd WEEDM2.0.1

# Install dependencies
npm install

# Set up database
npx prisma db push

# Copy environment config
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Free Deployment (30 Minutes)

See [SETUP.md](./SETUP.md) for the complete 30-minute free deployment guide including:
- Firebase setup (Google auth + cloud sync)
- Vercel deployment
- GitHub Actions CI/CD with staging

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ak46-prog/WEEDM2.0.1)

## Project Structure

```
src/
├── app/
│   ├── api/           # Backend API routes
│   │   ├── music/     # Music API endpoints
│   │   │   ├── search/    # YouTube search (multi-API)
│   │   │   ├── stream/    # Audio/video streaming proxy
│   │   │   ├── proxy/     # 4-layer stream resolver
│   │   │   ├── trending/  # Trending music (music-only)
│   │   │   ├── playlists/ # Playlist management
│   │   │   ├── favorites/ # Favorites management
│   │   │   └── history/   # Play history
│   │   └── route.ts   # Health check
│   ├── layout.tsx     # Root layout with themes
│   └── page.tsx       # Main app page
├── components/
│   ├── auth-button.tsx      # Firebase auth UI
│   ├── audio-manager.tsx    # Core playback engine (4-layer fallback)
│   ├── music-player.tsx     # Player UI bar
│   ├── video-player.tsx     # Video display
│   ├── header.tsx           # App header & search
│   ├── app-sidebar.tsx      # Navigation sidebar
│   ├── hero-banner.tsx      # Home page banner
│   ├── trending-section.tsx # Trending music grid
│   ├── voice-search.tsx     # Voice input
│   ├── library-view.tsx     # Library & playlists
│   └── ...
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── firebase-sync.ts # Auth & cloud sync hooks
│   ├── store.ts         # Zustand state management
│   ├── db.ts            # Prisma database client
│   └── utils-music.ts   # Music utilities
└── ...
```

## Audio Streaming Architecture

```
User clicks Play
       │
       ▼
┌──────────────────────────┐
│  YouTube IFrame (instant)│──► Playing in <1s
│  + Parallel Proxy Fetch  │
└──────────┬───────────────┘
           │
     ┌─────▼─────┐
     │  Layer 1   │ ytdl-core (5s timeout)
     │  Layer 2a  │ InnerTube ANDROID_MUSIC (4s)
     │  Layer 2b  │ InnerTube TVHTML5 (5s)
     │  Layer 3   │ Invidious ×6 instances (6s)
     │  Layer 4   │ Piped ×3 instances (6s)
     └─────┬──────┘
           │
   First success → Switch to direct audio
   All fail → YouTube IFrame continues (always works)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | No | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | No | Firebase Realtime DB URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | No | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | No | Firebase app ID |

See [.env.example](./.env.example) for a complete template.

## Cost Breakdown

| Service | Cost | Limit |
|---------|------|-------|
| Vercel | FREE | 100GB/month |
| Firebase | FREE | 100 concurrent users |
| YouTube/Piped APIs | FREE | Unlimited |
| GitHub | FREE | Unlimited |
| **Total** | **$0** | **10K users** |

## Security

- 256-bit TLS encryption (HSTS Preload)
- CSP headers
- All security headers included
- Firebase Auth with Google OAuth 2.0

## License

This project is licensed under the **BSD 3-Clause** License.

---

<p align="center">
  <a href="https://ak46-prog.github.io/WEEDMUSIC/">
    <img src="https://img.shields.io/badge/Launch_Player-Listen_Now-green?style=for-the-badge" alt="Launch Player" />
  </a>
  <a href="https://github.com/ak46-prog/WEEDM2.0.1">
    <img src="https://img.shields.io/badge/Source_Code-WEEDM2.0.1-blue?style=for-the-badge" alt="Source Code" />
  </a>
  <img src="https://img.shields.io/badge/Security-256_bit_Encrypted-brightgreen?style=for-the-badge" alt="256-bit Encrypted" />
</p>

<p align="center">
  Built with love by <a href="https://github.com/ak46-prog">ak46-prog</a> • v2.1.0 Enhanced with Firebase & Multi-Layer Streaming
</p>
