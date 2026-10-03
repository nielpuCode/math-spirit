# Math Sprint

Fast mental-math practice for 2-digit arithmetic. Big type, tight layout, tricky multiple choice. Built for phones first.

## Features

- **Four operations** — addition, subtraction, multiplication, division
- **Integer-only problems** — division always exact; subtraction may be negative
- **Tricky answer choices** — common error patterns (carry misses, sign flips, off-by-ten, digit shuffles)
- **Flexible runs** — fixed question count (default 20) or infinite mode with live score
- **Instant feedback** — correct/incorrect flash, then auto-advance
- **Mobile-first UI** — fits common phone viewports without scrolling mid-round
- **No account, no backend** — static site, open and play

## Quick start

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## How to play

1. Set question count, or enable **Infinite mode**
2. Tap **Play**
3. Read the equation, tap an answer
4. Green = correct, red = wrong; next question loads automatically
5. Finite runs end with a score screen; infinite runs end when you tap **Stop**

## Project structure

```
.
├── index.html          # UI + Tailwind CDN
├── js/
│   ├── generator.js    # Problem + distractor logic (pure)
│   └── game.js         # Screens, state, feedback
├── test/
│   └── generator.test.mjs
├── vercel.json
└── README.md
```

## Tech stack

- HTML, CSS (Tailwind CSS via CDN), vanilla JavaScript
- No build step, no database, no login

## Tests

Generator self-check (Node 18+):

```bash
node test/generator.test.mjs
```

## Deploy to Vercel

1. Push this repository to GitHub
2. In Vercel: **Add New → Project** → import the repo
3. Framework Preset: **Other**
4. Root Directory: **/** (repo root)
5. Build Command: leave empty
6. Output Directory: leave empty (static files)
7. **Deploy**

`vercel.json` already enables clean URLs. No environment variables required.

## License

Add a license file if you plan to publish under one (MIT is a common default).
