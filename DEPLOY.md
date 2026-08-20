# Deploying The Who? Invitational Open

Staging first, production only once you have looked at staging. Ten minutes,
and it costs nothing — Cloudflare's free tier covers this many times over.

Every command below runs from the repository root on **your** machine. The
config has been dry-run validated (`wrangler deploy --dry-run`) for both
environments, so the only things missing are your login and two KV namespace ids.

---

## 1. Get the code

```bash
git clone https://github.com/mightymeatllc/Who-Invitational.git
cd Who-Invitational
git checkout claude/vibrant-ramanujan-t5hwow
```

Already cloned? `git fetch origin && git checkout claude/vibrant-ramanujan-t5hwow && git pull`

## 2. Install

```bash
npm install
```

Needs Node 18 or newer (`node --version`).

## 3. Look at it locally first

```bash
npm run preview
```

Open <http://localhost:8788>. This runs the real Worker against an in-memory
scoreboard — no Cloudflare account involved, nothing to clean up afterwards.
Ctrl-C when done.

## 4. Run the checks

```bash
npm run check
```

59 assertions over the roster, the handicap arithmetic, the course card, the
scramble pairs and all three scoring rules. Everything should say PASS. If
anything fails, stop and fix it before deploying.

## 5. Log in to Cloudflare

```bash
npx wrangler login
```

Opens a browser to authorise. On a machine with no browser, use
`npx wrangler login --browser false` and follow the printed URL.

Confirm it worked:

```bash
npx wrangler whoami
```

---

## 6. Create the staging scoreboard storage

```bash
npx wrangler kv namespace create SCORES --env staging
```

It prints something like:

```
{ "binding": "SCORES", "id": "9f2b41c0e1d84a7fb0c6e2a8d3915742" }
```

**Copy that id.**

> Do **not** reuse the existing namespace `fa662c0324b5469099f26fe81f2a99bf`.
> That one is bound to the live site and holds the current cards — a test score
> posted during review would land in real data.

## 7. Paste the id into the config

Open `wrangler.jsonc` and replace `REPLACE_WITH_STAGING_KV_NAMESPACE_ID`
on **line 46** with the id from the previous step:

```jsonc
"env": {
  "staging": {
    "name": "who-invitational-staging",
    "workers_dev": true,
    "kv_namespaces": [
      {
        "binding": "SCORES",
        "id": "9f2b41c0e1d84a7fb0c6e2a8d3915742"   // <- yours here
      }
    ],
```

A namespace id is an identifier, not a credential — it is fine to commit it.

## 8. Deploy staging

```bash
npx wrangler deploy --env staging
```

You get a URL back:

```
https://who-invitational-staging.mightymeatllc.workers.dev
```

**The live site is untouched.** Different Worker, different URL, different
storage.

## 9. Smoke test staging

Open the URL and walk the four pages: Event, Teams, The Duel Card, Scoreboard.
Then test the scoreboard end to end:

1. Go to `/enter.html`.
2. Pick a unit, scorer key `meat`, enter nine holes, submit.
3. On the Scoreboard, that unit should show a **gross** score and `9/18` where
   the net goes. Net stays hidden until all eighteen are in — that is the rule
   working, not a bug.
4. Fill the remaining nine. Net appears. Team totals stay hidden until every
   unit on **both** teams is complete.

Wipe a test card when you are done with it:

```bash
curl -X DELETE "https://who-invitational-staging.mightymeatllc.workers.dev/api/card?unit=ryobi-jipp" \
  -H "X-Scorer-Key: meat"
```

Clear everything at once:

```bash
npx wrangler kv key list --binding SCORES --env staging --remote \
  | grep -o '"card:[^"]*"' | tr -d '"' \
  | xargs -I{} npx wrangler kv key delete {} --binding SCORES --env staging --remote
```

---

## 10. Production, once you are happy

This **replaces the live site** at `who-invitational.mightymeatllc.workers.dev`.
Same Worker name, same URL — the four-team version is gone the moment this
finishes.

```bash
npx wrangler kv namespace create SCORES
```

Paste that id over `REPLACE_WITH_KV_NAMESPACE_ID` on **line 21**, then:

```bash
npx wrangler deploy --env=""
```

The empty `--env=""` is deliberate: Wrangler 4 warns on a bare `deploy` when the
config has named environments, to stop you shipping the wrong one.

> A fresh namespace is cleaner than reusing the old one. The live storage still
> holds keys in the previous scheme (`card:jipp`), while this Worker writes
> `card:ryobi-jipp` and `card:bd-scramble`. Old keys would sit there inert but
> confusing.

## 11. Commit the ids

```bash
git add wrangler.jsonc
git commit -m "Add KV namespace ids"
git push
```

---

## Afterwards

**Scorer key.** It is `meat`, stored as a plain var in `wrangler.jsonc` — public
to anyone who can read the repo. Fine for sixteen men who know each other. To
make it private instead, delete the `vars` block from the config and run:

```bash
npx wrangler secret put SCORER_KEY
```

**Rolling back.** Cloudflare keeps previous versions:

```bash
npx wrangler deployments list
npx wrangler rollback [version-id]
```

**Watching it on the day.**

```bash
npx wrangler tail --env=""
```

**Clearing the board before the round.** Same key-delete loop as step 9, without
`--env staging`. Do this after any testing and before the first tee, or the
first cards in will be sitting next to junk.
