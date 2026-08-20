# The Who? Invitational Open

Tournament site for Saturday, August 29 — Hermitage Golf Course, President's Reserve.
Static pages plus a live scoreboard, both served by one Cloudflare Worker.

## Design

The bones are the previous program: a bone-paper sheet on a turf ground, the
green plaque with its brass keyline, `.band` headings under a double rule, and
folder tabs that clip to the top of the paper. Palette and type are unchanged
from that site — turf `#16341f`, brass, bone, Alfa Slab One / Oswald / Lora.

What changed: contrast is pushed harder, and the two teams own the pages that
are about the two teams. On Teams, the Duel Card and the Scoreboard, Ryobi and
Black+Decker take over in the structure of their own badges — Ryobi a filled
block with a yellow frame, B+D a hollow one in orange.

Note for future edits: raw `--team` (Ryobi `#d3d812`) is a badge colour and
fails contrast as text on bone paper. Use `--team-text`, the darkened form, for
type; keep `--team` for fills, frames and rules.

There is no dedicated roast page. The material on each player is dealt out
across the site — an epithet and a jab on every roster row, a committee note on
every cart, a case note on every duel, and a personalised verdict on the
scoreboard for whoever ends up as the dropped score.

## Layout

```
site/public/            static site (assets.directory)
  data/roster.json      ← single source of truth: players, teams, duels, carts, format
  js/jabs.js            ← roast copy only, keyed by player name
  js/data.js            roster loader + derived views (units, opponents, pairs)
  js/site.js            shared chrome, logo helpers, escaping
  fonts/                self-hosted Alfa Slab One + Oswald + Lora
  assets/logos/         the four supplied PNGs
  assets/flyer.jpg      the group photo, carried over from the previous site
site/src/index.js       the Worker: /api/* only, static files pass through to ASSETS
tools/dev-server.mjs    local harness — runs the real Worker against an in-memory KV
tools/check.mjs         asserts the scoring rules; run before any deploy
wrangler.jsonc          production + staging config
```

**There is one copy of the roster.** Every page reads `data/roster.json` at
render time, and so does the Worker (through the ASSETS binding). No page holds
its own copy of a handicap and none can drift.

`CLAUDE_CODE_PROMPT.md`, `roster.json` and `assets/` at the repo root are the
original delivered bundle, kept as received. The live files are the ones under
`site/`.

## Running it

```bash
npm install
npm run preview     # local harness on :8788 — no Cloudflare account needed
npm run dev         # wrangler dev, real Workers runtime + local KV, on :8787
npm run check       # scoring-rule assertions (39 checks)
```

## Deploying

Nothing is deployed yet. Both commands need a KV namespace id filled into
`wrangler.jsonc` first.

```bash
npx wrangler kv namespace create SCORES --env staging
npx wrangler deploy --env staging     # who-invitational-staging.<you>.workers.dev

npx wrangler kv namespace create SCORES
npx wrangler deploy                   # production
```

The scorer key is `meat`, set as a plain var in `wrangler.jsonc`. It lives in
the repo, so anyone who can read the repo can read the key — fine for sixteen
men who all know each other. To make it private instead, delete the `vars` block
and run:

```bash
npx wrangler secret put SCORER_KEY
```

## Scoring rules, and where they live

All three are enforced in the Worker, not the browser. A rule enforced in the
browser is a rule String has already broken.

| Rule | Behaviour |
|---|---|
| Gross is live | Posts to the board the moment a hole is entered. |
| Net is sealed | Withheld until a card has all eighteen holes on it. |
| Team totals are sealed | Withheld until every unit on **both** teams is in. |

The prompt said "team totals once all cards are in," which could be read as
*that team's* cards. It is implemented as **all fourteen**: publishing one team's
number while the other side is still on the course hands them a target to play
to. A team's *drop* does settle as soon as that team's seven are in, since it
does not depend on the other team.

Other constants that are deliberately not computed:

- **Scramble pair handicap is 12.** A committee number, hardcoded in
  `roster.json` and never recomputed. The formula route lands on 11.5, which
  Excel rounds to 12 and LibreOffice rounds to 11 — same file, two answers. It
  is pinned for that reason.
- **Triple bogey max** is applied server-side from `course.holes[].par`.
  Those pars are a **placeholder** — verify them against the pro shop scorecard
  and correct any that are wrong. Nothing else on the site depends on them.

## Scoring a card

`/enter.html`, one unit at a time, with the scorer key. Partial cards are fine
and prefill on return, so the back nine can be added later.

```
GET    /api/state              full board (net omitted where the rules seal it)
POST   /api/card               {unitId, holes:[18]}   X-Scorer-Key
DELETE /api/card?unit=<id>     wipe a card            X-Scorer-Key
```

## The field

Settled: Milo is out, Adam is in at an 11.5 index playing 10. That is what
`data/roster.json` has, and Ryobi's 90 strokes given already reflects it.

Swapping a player is still a one-record edit in `data/roster.json` — team,
duel, cart and every page follow from it — plus an entry in `js/jabs.js` keyed
to the same name. If you ever do swap someone, check the strokes-given spread
afterwards: the committee's rule of thumb is ±2, and `npm run check` asserts
that both teams' totals match the figures in `format.strokesGiven`.

## Logo rules

- Self-hosted only. Never hotlinked.
- Never displayed above 700px wide — these came from JPGs and the artifacts show
  at the type edges past that.
- Both badges are near-black on near-black, so every placement sits on a lifted
  panel with a border.
- Both are preloaded so the Winners' Circle reveal does not pop.
- Swapping in true SVGs later is a path change in `roster.json` and nothing else.
