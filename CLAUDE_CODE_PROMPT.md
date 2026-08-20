# Claude Code prompt — The Who? Invitational Open site rebuild

Paste everything below the line into Claude Code from the project root.

---

**Files supplied alongside this prompt:**

- `roster.json` — every player, team, handicap, duel, cart and format constant. **Use this as the single source of truth.** Copy it to `site/public/data/roster.json` (or import it as a module) and drive all five pages from it. Do not retype the tables below into your code; they are here so you can sanity-check the JSON, not so you can duplicate it.
- `assets/logos/` — four PNGs: `ryobi.png`, `ryobi-transparent.png`, `black-decker.png`, `black-decker-transparent.png`. Copy to `site/public/assets/logos/`.
- `Who_Invitational_v7.xlsx` — the committee's working spreadsheet. Reference only; the site never reads it. Useful if you need to check how a number was derived.

I'm rebuilding the tournament site for The Who? Invitational Open. The format changed from four teams to two, and the tone is changing from "vintage flyer" to **roast**. Read the existing site under `site/public/` and the Worker at `site/src/index.js` before changing anything, then work through the sections below.

## 1. Format changes (data + copy, all four pages)

The event is now **two teams of eight**, not four teams of four.

- **Team Ryobi** — Jipp, Adam, Neels, Pat, Dan, Landon, String, Terb
- **Team Black & Decker** — Joe, Tito, Meat, Ron, Latex, Toe, Hulk, Rat

Playing handicaps (index × 90%, capped at 25 index):

| Player | Index | Playing Hdcp | Team | Plays as |
|---|---|---|---|---|
| Jipp | 3.2 | 3 | Ryobi | Individual |
| Adam | 11.5 | 10 | Ryobi | Individual |
| Neels | 13.9 | 13 | Ryobi | Individual |
| Pat | 14.9 | 13 | Ryobi | Individual |
| Dan | 18.0 | 16 | Ryobi | Individual |
| Landon | 25.0 (committee estimate) | 23 | Ryobi | Individual |
| String | 25.0 (committee estimate) | 23 | Ryobi | Scramble |
| Terb | 25.0 (committee estimate) | 23 | Ryobi | Scramble |
| Joe | 7.5 | 7 | Black & Decker | Individual |
| Tito | 10.6 | 10 | Black & Decker | Individual |
| Meat | 13.6 | 12 | Black & Decker | Individual |
| Ron | 13.4 | 12 | Black & Decker | Individual |
| Latex | 19.0 | 17 | Black & Decker | Individual |
| Toe | 23.0 | 21 | Black & Decker | Individual |
| Hulk | 25.0 (committee estimate) | 23 | Black & Decker | Scramble |
| Rat | 25.0 (committee estimate) | 23 | Black & Decker | Scramble |

**Scoring**

- Individual net stroke play. Triple bogey max on any hole.
- Six men per team play their own ball. Two play as a 2-man scramble pair.
- Seven scoring units per team: six individual net scores + one scramble net score.
- **Team score = the best SIX of seven. The worst unit is dropped and named publicly on the scoreboard.**
- Ryobi Scramble = String + Terb. B&D Scramble = Rat + Hulk. Pair handicap **12** each — a committee number, hardcoded. Do not recompute it.
- **Tees:** everyone plays Blue except the two scramble pairs, who play **White**.
- Strokes given: Ryobi 90, Black & Decker 91.
- **Money:** $50 a man, $800 pot, winner take all. Winning eight get $100 back. No second place.

**The Duel Card** — a new page. Each man has one opponent on the other team; low net over 18 wins; strokes are the difference in playing handicaps taken on the lowest-index holes. Side wagers are private and the committee settles nothing.

| # | Ryobi | Hdcp | Black & Decker | Hdcp | Strokes | Given to |
|---|---|---|---|---|---|---|
| 1 | Jipp | 3 | Joe | 7 | 4 | Joe |
| 2 | Adam | 10 | Tito | 10 | 0 | — |
| 3 | Neels | 13 | Meat | 12 | 1 | Neels |
| 4 | Pat | 13 | Ron | 12 | 1 | Pat |
| 5 | Dan | 16 | Latex | 17 | 1 | Latex |
| 6 | Landon | 23 | Toe | 21 | 2 | Landon |
| 7 | Ryobi Scramble | 12 | B&D Scramble | 12 | 0 | — |

Do **not** put tee groups, cart numbers, or any "are these two playing together" indicator on the Duel Card. The duels and the carts are deliberately independent and the page should not invite that argument.

**Carts and tee groups** (10 minutes apart):

| Cart | Riders | Group |
|---|---|---|
| 1 | Jipp / Adam | A |
| 2 | Joe / Tito | A |
| 3 | Dan / Meat | B |
| 4 | Toe / Neels | B |
| 5 | Latex / Ron | C |
| 6 | Landon / Pat | C |
| 7 | String / Terb | D |
| 8 | Rat / Hulk | D |

**Milo contingency:** Milo may still take Adam's seat pending a knee decision — final word expected today. Drive the roster from a single data file (JSON or a JS const) so swapping one entry updates every page. If Milo replaces Adam, his index is a 25.0 committee estimate (playing 23), which unbalances Ryobi badly — surface a warning in a comment near the roster data. Add a Milo dossier entry that ships commented out.

## 2. Tone — roast, and mean

The old vintage-flyer aesthetic goes. New direction: **a roast card / fight promo**. Think tale-of-the-tape, mugshot boards, prosecution exhibits. Every player gets a **dossier card** with his handicap, his team, his duel, and a roast blurb.

The tone should be genuinely mean — this is a group of friends who insult each other constantly and asked for it. No hedging, no "just kidding," no softening. Punch at the bit, hard. But keep it to the material below.

Write 2–4 sentences per player from these dossiers. Give each a **rap sheet nickname** and a mock **"official charge."**

1. **Landon** — Has a golf simulator in his garage and turned in a 25 committee estimate. Claims he never plays. Lives out in the middle of nowhere, unsupervised, with a screen and unlimited time. Nobody can verify a single thing he says about his game. Angle: the sandbagging case against him is entirely circumstantial and entirely damning. Charge should be something like "Handicap fraud, first degree."

2. **Hulk** — The reason the group is called "Who?" He talks and the conversation continues without him. People genuinely forget he was there. Also has indefensible sports takes, and his favorite sport is soccer. Angle: a man who has to be reintroduced at every gathering. Charge: something about being unmemorable.

3. **Rat** — The quirkiest man in the field. Unspecified weird habits, and the vagueness is the joke — nobody wants to itemize them. Angle: everyone has seen something and nobody talks about it.

4. **Meat** — Fat and bald. Also the organizer: he built this site, the spreadsheet, the handicap system and the scoreboard, which means he has spent more hours on the tournament than he will spend playing in it. Angle: a man who scheduled his own roast. Do not go easy on him — he asked to be included.

5. **Dan** — Enthusiastically pro-drug. Cocaine, mushrooms, whatever is going. Quiet almost to the point of absence, and then says the funniest thing anyone says all day. Angle: nobody knows which Dan is arriving on the 29th, and neither does Dan. Lean into the pharmacy — the joke is that his pre-round routine has more steps than his pre-shot routine, and that a 16 handicap is impressive for a man who may be watching the fairway breathe. Make the drug material explicit and funny, not coy.

6. **Adam** — Toe's little brother. The two of them get drunk and argue and scuffle every single time, without exception. Angle: the tournament had to put them on opposite teams as a public safety measure, and the pool party is at Toe's house, so the argument has a guaranteed second act with a swimming pool involved. Play the little-brother dynamic hard — Adam is the younger one and will be the younger one at sixty.

7. **Terb** — Six foot ten. Depth perception is more of an aspiration than a fact. Angle: the largest human on the property, aiming approximately.

8. **Joe** — Nine children. Member of a prestigious country club. Takes golf far too seriously and cannot take a joke about it. Angle: the only man here who will be genuinely upset by his own dossier card, which is exactly why it exists. Nine kids and he still finds time to work on his swing — make that damning.

9. **Pat** — Cursed. It is always the world versus Pat. Permanently sick kids, permanent war with corporate America, an ongoing multi-year campaign against AT&T. The group maintains he has a personal rain cloud. Angle: whatever goes wrong on the 29th will go wrong to Pat specifically.

10. **Ron and Latex** — Latex holds a membership at an exclusive jewish swim club. Ron is openly, corrosively jealous and has never once let it go. Angle: a multi-year cold war between two grown men over a swimming pool. Latex mentions the club unprompted; Ron has a rebuttal prepared before the sentence ends. Play it as a documented rivalry with a case file — who brought it up first, how many times per round, the exact tone Ron uses when he says "your little club." They are duelling separate opponents on the 29th and will still find a way to make the day about the pool. Note also that the whole event ends at a pool party at Toe's Abode, which means Latex has to swim somewhere unaccredited and Ron gets to watch. Keep it strictly about the club and the pettiness — that is the entire bit. Who will wear the yarmulke to the golf outing? Who is more jewish?

11. **Jipp** — Lowest handicap in the field and the highest liability. Always the drunkest man present, and every single time he does something stupid. Angle: a 3 handicap and a 3-drink limit nobody enforces.

12. **Tito** — Drinks vodka like it's water. Requires a designated chaperone once he starts, and everyone knows why. Angle: the group has a monitoring protocol for him. Do not spell out what he says — the implication and the chaperone do the work.

13. **Neels** — Thirty-nine years old, dating someone twenty-two or twenty-three. Nobody is certain which, including possibly Neels. Angle: the arithmetic. He was already old enough to drive when she was born. He brings her up unprompted and everyone does the subtraction in real time. Play the gap, the vagueness about her actual age, and the fact that his playing handicap of 13 is only slightly younger than she is. Keep it on the age gap — that is the whole joke.

14. **String** — Cheats at everything. Always finds the loophole, always working an edge. Angle: he read the rules page not to comply with it but to look for exploits. Reference the triple-bogey cap and the drop score as things he has already tried to game.

15. **Toe** — The host. The pool party is at his house, which is the only reason anyone tolerates him. A divorce lawyer who has never been married and has not had a girlfriend in a decade — he has built an entire career on the collapse of a thing he has never once attempted. Angle: professional expert on a subject he has no field experience in.

    More on Toe, and use all of it:
    - Solves every problem by throwing money at it. Has never fixed anything with his hands, including anything Ryobi or Black+Decker manufactures.
    - Drunk. Consistently, reliably, as a lifestyle rather than an event.
    - Has not cooked a meal in living memory. Every single thing he eats arrives by Uber Eats or DoorDash, delivered to a house he is about to host a party in.
    - Rumored to have a romantic connection with his cleaning lady. Say "his cleaning lady" explicitly and frame it as rumor — the group's word, not established fact. Do not name her and do not describe her; she is not part of this group and does not belong on a public page. The joke is entirely Toe's: a divorce lawyer who outsources every function of adult life — his meals, his housekeeping, his problems — and has apparently outsourced romance to the same vendor list. The closest thing he has had to a relationship in ten years arrives on a schedule.
    - Adam's older brother, and the older brother energy never switches off.
    - His index just moved from 20 to 23 with no explanation offered. Angle: he watched Landon's committee estimate get waved through and got ideas. He is 21 strokes deep in a duel against a man with a simulator in his garage — two alleged sandbaggers pointed directly at each other, which is the most honest matchup on the card.
    - Note for the Event page: the pool party at "Toe's Abode" is his. Any mention of the venue is an opportunity.

## 3. Pages

Five pages: **Event**, **Teams**, **The Duel Card**, **Rap Sheet** (all 16 dossiers), **Scoreboard**.

- Header: THE WHO? INVITATIONAL OPEN — Saturday, August 29 · Hermitage Golf Course, President's Reserve, Old Hickory TN · Tee times start 9 AM · Pool party after at Toe's Abode.
- Presented by Ryobi (this is a bit; keep it deadpan).
- Ryobi = the acid yellow-green. Black & Decker = orange and black. Push the contrast hard.
- Rap Sheet is the centerpiece — make it the best-looking page.
- Mobile first. Everyone reads this on a phone in a cart.

## 3b. Team branding and logos

Team identity is the visual backbone of the site. These two palettes should never be mistaken for each other at a glance, on a phone, in sunlight.

**Exact colors, sampled from the supplied logo files — use these, do not eyeball them:**

```css
--ryobi-yellow:  #D3D812;   /* the acid yellow-green badge frame */
--ryobi-black:   #231F20;   /* the badge field, a warm near-black */
--ryobi-white:   #FFFFFF;   /* the wordmark */

--bd-orange:     #F28122;   /* the rounded-rect frame and wordmark */
--bd-black:      #0E0A0B;   /* the field, a cooler near-black */
```

Ryobi is a filled badge: yellow frame, near-black field, white type. Black+Decker is an outline badge: orange rounded rectangle, orange type, black field. That structural difference is useful — Ryobi reads as solid and corporate, B&D reads as hollow. Lean on it. Ryobi is the sponsored team; B&D is the outline of a sponsor.

**Logo files, at `site/public/assets/logos/`:**

| File | Use |
|---|---|
| `ryobi.png` (1383×585) | Ryobi badge, its own black field baked in. Default for most placements. |
| `ryobi-transparent.png` | Ryobi badge with the black field knocked out. Use over photos or colored panels. |
| `black-decker.png` (1200×620) | B+D badge on black. Default. |
| `black-decker-transparent.png` | B+D badge knocked out. Use over photos or colored panels. |

Rules for using them:

- **Self-host only.** Never hotlink from ryobitools.com, blackanddecker.com, or any CDN not under our control.
- These came from JPGs, so there is mild compression noise at the type edges. **Never display either above 700px wide** — past that the artifacts show. They are sharp at nav-bar and card sizes, which is where they live.
- Both are near-black-on-near-black by design. On a dark page background, give each a subtle border or a slightly lifted panel behind it, or the badge edge disappears.
- Preload both so the Winners' Circle reveal does not pop.
- Real `alt` text on both.

**Where they go:**

- **Teams page** — each team's roster sits under its badge, full width of the column. This is the primary placement; make it big.
- **Winners' Circle** — the winning team's badge is the hero element, largest instance of the logo anywhere on the site. Animate it in.
- **Duel Card** — small badge at the head of each team's column, not repeated per row.
- **Rap Sheet** — small team mark on each dossier card, sized like a booking stamp.
- **Biggest Loser card** — show the badge of the team the dropped man plays for, desaturated or at reduced opacity. He is still on that team; it just isn't good news for them.

If you can later source true SVG versions, they drop in as replacements with no layout change — build the markup so swapping the file path is the only edit.

The "PRESENTED BY RYOBI" line in the header stays deadpan and unexplained. It is funnier if the site never acknowledges that it is a bit.

## 4. Scoreboard

Keep the existing Cloudflare Worker + KV backend and its rules: gross scores live, net hidden until a full 18-hole card is submitted, team totals once all cards are in. Scramble pairs score as one unit at handicap 12.

The finished scoreboard has three headline moments, in this visual order of importance:

**A. The Winners' Circle — the biggest thing on the page.**
When all fourteen units are in, the winning team takes over the top of the screen. Full-width, team colors, the works — a trophy treatment, the winning eight named individually, the final margin, and "$100 a man" stated plainly. It should feel like the page was built for this one element and everything else is a footnote. Confetti or an equivalent celebratory animation on first reveal is welcome. Losing team gets a small, grey, dismissive strip underneath with their total and nothing else.

**B. The Biggest Loser — the dropped score.**
Each team drops its worst unit. The two dropped men (or the dropped pair) get their own card, sized second only to the Winners' Circle, styled as the exact opposite of it: harsh, stark, unflattering. Name, gross, net, and how many strokes clear of relevance they were. Copy along the lines of "contributed nothing," "played eighteen holes for no reason," "his round has been thrown away." Give it a permanent title — BIGGEST LOSER, or DEAD WEIGHT, or THE DROP — and make it a fixture of the page, not a footnote.

Even the winning team has a dropped score. Do not exempt them: a man can win $100 and still be publicly named the most useless golfer on his own team, and the page should point that out explicitly.

During the round, run a live "currently the drop" indicator on each team, updating as cards come in, so the man in that slot has to watch himself sitting in it all afternoon.

**C. Duel by duel.**
Seven rows, one per duel, each showing both men, strokes given, both net scores, and the winner marked unmistakably — winner's name in team color and bold, loser's struck through or greyed out. Once both cards in a duel are complete, lock the result and show it. Ties display as a tie; the committee settles nothing.

Duel results do not affect the team result — keep that clear on the page so nobody argues about it later.

## 5. Build notes

- One roster data file feeding every page. No duplicated player data across pages.
- Verify each page renders before moving on.
- `node --check` any extracted script blocks.
- Keep the zip structure: `site/public/` for static assets, `site/src/index.js` for the Worker, matching `assets.directory` and `main` in `wrangler.jsonc`.
- Don't deploy. Show me the diff and let me review before publishing.
