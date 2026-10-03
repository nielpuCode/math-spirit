# Math Sprint

Fast mental-math practice for 2-digit arithmetic. Big type, tight layout, tricky multiple choice. Built for phones first — solo or 1v1 with a friend.

## Features

- **Four operations** — addition, subtraction, multiplication, division
- **Integer-only problems** — division always exact; subtraction may be negative
- **Tricky answer choices** — common error patterns (carry misses, sign flips, off-by-ten, digit shuffles)
- **Solo modes** — fixed question count (default 20) or infinite mode with live score
- **1v1 multiplayer** — room code, shared questions, cyan vs amber (no names), ready + 3-2-1 countdown
- **Instant feedback** — correct/incorrect flash, then auto-advance
- **Mobile-first UI** — fits common phone viewports without scrolling mid-round
- **No account, no backend** — static build; multiplayer uses WebRTC (PeerJS)

## Requirements

- Node.js 20+
- npm

## Development

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite dev server (hot reload) |
| `npm run dev:host` | Dev server on LAN (all network interfaces) |
| `npm test` | Generator + winner logic checks |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

### Testing 1v1 on two devices

1. `npm run dev:host`
2. Note the Network URL (e.g. `http://192.168.1.5:5173`)
3. Both phones open that URL **on the same Wi-Fi**
4. Host creates room, guest joins with the code

**WebRTC needs a secure context.** `localhost` is always allowed. Plain `http://192.168.x.x` may block multiplayer in some browsers — if 1v1 fails on LAN, test solo on localhost, or put HTTPS in front (e.g. `npx localtunnel --port 5173`, or deploy to Vercel and test there).

## How to play (solo)

1. Set question count, or enable **Infinite mode**
2. Tap **Play**
3. Read the equation, tap an answer
4. Green = correct, red = wrong; next question loads automatically
5. Finite runs end with a score screen; infinite runs end when you tap **Stop**

## How to play (1v1)

1. Both phones open **Play 1v1**
2. Host: set questions (default **10**, range 1–500) → **Create room**
3. Share the **6-character code** (Copy button on host)
4. Guest: enter code → **Join**
5. Both tap **Ready** → countdown **3 · 2 · 1** starts the match
6. Same questions on both devices; progress bars show cyan (you) vs amber (friend)
7. **Winner** = most correct; tie → faster total time
8. If a player disconnects, the other wins after a **10s** grace period

## Project structure

```
.
├── index.html          # App shell (screens injected by js/main.js)
├── screens/            # UI split per screen (keeps index.html small)
│   ├── home.html
│   ├── lobby.html
│   ├── wait.html
│   ├── play.html
│   └── results.html
├── css/style.css       # Tailwind v4 + theme keyframes
├── js/
│   ├── main.js         # Entry — injects screens then loads game
│   ├── generator.js    # Problem + distractor logic (pure)
│   ├── multi.js        # PeerJS room transport + winner rules
│   └── game.js         # Screens, state, solo + 1v1 flow
├── test/
│   ├── generator.test.mjs
│   ├── winner.test.mjs
│   └── host-count.test.mjs
├── vite.config.mjs
├── package.json
├── vercel.json
└── README.md
```

## Tech stack

- Vite 7 + Tailwind CSS 4 + vanilla JavaScript
- **1v1:** PeerJS (WebRTC data channels) — signaling via public PeerJS cloud
- No database, no login

## Tests

```bash
npm test
```

## Deploy to Vercel

1. Push to GitHub
2. Vercel → **Add New → Project** → import repo
3. Framework Preset: **Vite** (auto-detected from `package.json` / `vercel.json`)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Deploy**

No environment variables. Works on the Vercel free tier.

After the first Vercel deploy, open the **production URL** for 1v1 (HTTPS is required there and already provided).

## Multiplayer notes

- P2P: phones connect directly; the host device holds the room
- If the host closes the tab, the room ends
- Strict networks may block WebRTC without TURN — not included in v1
- Upgrade path: custom signaling (Cloudflare Worker) or Supabase Realtime

## License

Add a license file if you plan to publish under one (MIT is a common default).
