# AGENTS.md

Static Vite app (vanilla JS + Tailwind v4). No backend, no framework, no accounts.
README.md is accurate for features; this file covers the wiring that filenames don't explain.

## Commands

```bash
npm run dev              # Vite dev server, already LAN-exposed (server.host=true in vite.config.mjs)
npm test                 # generator + winner/rank + names + party (node, from repo root)
npm run build            # -> dist/
```

- No lint, typecheck, or formatter exists. Don't invent one.
- `dev:host` in package.json is redundant — `vite.config.mjs` already sets `host: true`.
- Tests use `createRequire` + relative `fs` paths → run from repo root, and they `require()` the js files as CommonJS.

## Screens are injected HTML, not a router

`index.html` has one empty `<main id="app">`. `js/main.js` imports all five `screens/*.html` with Vite's `?raw` and concatenates them into `#app`, then dynamically imports `generator.js` → `names.js` → `multi.js` → `party.js` → `game.js`.

Consequences:
- Every screen is in the DOM simultaneously. `showScreen()` (js/game.js) toggles `hidden`/`flex` on `#screen-<name>`.
- To add a screen: new `screens/x.html` with `<section id="screen-x" hidden class="flex …">`, import it in `main.js`, add `'x'` to `SCREENS` in js/game.js. Miss any of the three and the screen never appears.
- HTML `id`s are global across all screen files. A duplicate id silently breaks `getElementById` for both screens — check before reusing a name.
- The js files never `import` each other. They communicate through globals, so load order in `main.js` is load-bearing: `game.js` reads `globalThis.MathSprintGen / Names / Multi / Party` at IIFE time.

## Module shape

Pure modules are dual-mode IIFEs: `module.exports = api` for Node, `root.MathSprintX = api` for the browser. A new pure module must follow that pattern to stay testable, and must be added to `main.js` before its consumers.

- `js/generator.js` — problems + distractors. Untouched by multiplayer.
- `js/names.js` — nickname list (`NAMES`, append here), `randomName`, `normalize`, `uniqueName`, `loadCustom`/`saveCustom` (localStorage `mathsprint.name`). Only user-typed names are persisted; random defaults never are.
- `js/party.js` — room state, no DOM, no Peer: roster, ready gate (`allReady` needs ≥2 players), per-answer accumulation, `MAX_PLAYERS = 8`. Host and guest call the same functions — roster logic exists once.
- `js/multi.js` — transport only, never touches players. Guest = one `conn`; host = `conns` map + `broadcast`/`sendTo`/`relay`/`drop`. Inbound messages get `data.from` stamped (kept if already set, so host relays preserve the origin). `decideWinner` is legacy-kept for its test; N-player standings use `rank()`.
- `js/game.js` (~1150 lines) — screens, solo flow, multiplayer wiring/render only. Score math lives in `party`/`multi`, not here.

## Multiplayer wire protocol (star relay through host)

PeerJS 1.5.4 loaded from unpkg via `<script>` in `index.html` — not an npm dep. Message shape is `{ type: '…' }`; `multi.js` re-emits each message as an event named by its `type`. Types: `hello`, `welcome`, `roster`, `ready`, `begin`, `answered`, `left`, `error`. There is no `progress` message — scores derive from per-answer `answered` broadcasts.

- Join: guest sends `hello {name}` on connect; host assigns id + auto-suffixed unique name, replies `welcome {id, name}`, broadcasts `roster` on every join/ready/leave.
- Start: host only, when `allReady()`; `begin {questions, count, grace}`. Countdown is a local duration per client (phone clocks skew, so no shared absolute deadline). `grace` = host's per-question seconds (0–10, 0 = off), clamped on receipt with fallback 3.
- Race: every answer (incl. host's, with `from` preset) is fanned out; receivers apply scores always (except lobby/done), start the 3s grace only when `data.index === current` and unlocked, and park it in `pendingGrace` if it lands during the 550ms feedback lock (`nextQuestion` picks it up).
- All names hit the DOM via `textContent` only — never `innerHTML` with a name in it.

WebRTC needs a secure context. `localhost` is fine; plain `http://192.168.x.x` may block multiplayer in some browsers. Verify multiplayer on localhost solo or an HTTPS deploy, not LAN http.

## Tests

- `test/host-count.test.mjs` is **not** in `npm test`. Run it manually: `node test/host-count.test.mjs`.
- It asserts `js/game.js` *source text* contains specific identifiers (`hostQuestionCount`, `pendingCount`, `q-minus`, `q-display`, `readHostCount`, `grace-count`, `g-display`, `readGraceDur`) and reads `dist/index.html` — so it fails unless `npm run build` ran, and renaming those identifiers/ids breaks it even when the app works.
- It re-implements `readHostCount` locally instead of importing it; keep both in sync when changing the 1–500 clamp.

## Conventions

- Deliberate cut corners are marked with a `// ponytail:` comment naming the ceiling and upgrade path, on line 1 of each `js/` file. Keep that format when adding one.
- Tailwind v4 with no `tailwind.config.js`; theme tokens and the `anim-*` / `op-*` / `result-*` classes live in `css/style.css`. Multiplayer rows/bars/standings are built with inline Tailwind classes in `game.js`, no new CSS needed.
- Mobile-first is a hard constraint: the play screen must fit common phone viewports without scrolling mid-round. `body` is `overflow-hidden`; the bars list is capped (`max-h-28` + scroll).
- No environment variables anywhere. Deploy is `vercel.json` → `dist` on Vercel.
