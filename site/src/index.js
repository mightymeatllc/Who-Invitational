/*
 * THE WHO? INVITATIONAL OPEN — scoreboard Worker
 *
 * Static site is served by the ASSETS binding. This Worker owns /api/* only.
 *
 * The three scoring rules are enforced HERE, not in the browser, because a rule
 * enforced in the browser is a rule String has already broken:
 *
 *   1. Gross is live the moment a hole is posted.
 *   2. Net is withheld until a card has all eighteen holes.
 *   3. Team totals are withheld until every unit on both teams is complete.
 *
 * The roster is read from /data/roster.json through the ASSETS binding, so this
 * file holds no copy of the roster and cannot drift from it.
 */

const ROSTER_URL = '/data/roster.json';
const CARD_PREFIX = 'card:';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (url.pathname === '/api/state' && request.method === 'GET') {
        return json(await buildState(request, env));
      }

      if (url.pathname === '/api/card' && request.method === 'POST') {
        const denied = authorize(request, env);
        if (denied) return denied;
        return json(await saveCard(request, env));
      }

      if (url.pathname === '/api/card' && request.method === 'DELETE') {
        const denied = authorize(request, env);
        if (denied) return denied;
        const unitId = url.searchParams.get('unit');
        const roster = await getRoster(request, env);
        if (!roster.units.some((u) => u.id === unitId)) return json({ error: 'unknown unit' }, 400);
        await env.SCORES.delete(CARD_PREFIX + unitId);
        return json(await buildState(request, env));
      }

      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: String(err && err.message ? err.message : err) }, 500);
    }
  }
};

/* ── auth ─────────────────────────────────────────────────────────────────── */
function authorize(request, env) {
  const key = request.headers.get('X-Scorer-Key') || '';
  if (!env.SCORER_KEY || key !== env.SCORER_KEY) {
    return json({ error: 'bad scorer key' }, 401);
  }
  return null;
}

/* ── roster ───────────────────────────────────────────────────────────────── */
let rosterCache = null;

async function getRoster(request, env) {
  if (rosterCache) return rosterCache;
  const res = await env.ASSETS.fetch(new Request(new URL(ROSTER_URL, request.url)));
  if (!res.ok) throw new Error(`cannot read roster.json (${res.status})`);
  const r = await res.json();

  /* Seven units per team: six individuals plus one scramble pair. */
  const units = [];
  for (const t of r.teams) {
    for (const p of r.players.filter((x) => x.team === t.id && x.playsAs === 'individual')) {
      units.push({
        id: `${t.id}-${p.name.toLowerCase()}`,
        label: p.name,
        kind: 'individual',
        team: t.id,
        handicap: p.handicap,
        members: [p.name]
      });
    }
    const pair = r.scramblePairs.find((s) => s.team === t.id);
    if (pair) {
      /* Committee number. Never recomputed, in this file or any other. */
      units.push({
        id: pair.id,
        label: pair.name,
        kind: 'scramble',
        team: pair.team,
        handicap: pair.handicap,
        members: pair.players.slice()
      });
    }
  }

  const pars = Object.fromEntries(r.course.holes.map((h) => [h.hole, h.par]));
  const sidx = Object.fromEntries(r.course.holes.map((h) => [h.hole, h.strokeIndex]));
  rosterCache = { raw: r, units, pars, sidx };
  return rosterCache;
}

/* ── writes ───────────────────────────────────────────────────────────────── */
async function saveCard(request, env) {
  const body = await request.json();
  const roster = await getRoster(request, env);
  const unit = roster.units.find((u) => u.id === body.unitId);
  if (!unit) throw new Error(`unknown unit "${body.unitId}"`);

  if (!Array.isArray(body.holes) || body.holes.length !== 18) {
    throw new Error('holes must be an array of 18 entries (null for a hole not yet played)');
  }

  const holes = body.holes.map((v, i) => {
    if (v === null || v === '' || v === undefined) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error(`hole ${i + 1}: "${v}" is not a score`);
    return n;
  });

  await env.SCORES.put(
    CARD_PREFIX + unit.id,
    JSON.stringify({ unitId: unit.id, holes, updatedAt: new Date().toISOString() })
  );

  return buildState(request, env);
}

/* ── reads ────────────────────────────────────────────────────────────────── */
async function readCards(env) {
  const out = {};
  let cursor;
  do {
    const page = await env.SCORES.list({ prefix: CARD_PREFIX, cursor });
    for (const k of page.keys) {
      const raw = await env.SCORES.get(k.name);
      if (raw) {
        const c = JSON.parse(raw);
        out[c.unitId] = c;
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

/* Triple bogey max on any hole. */
const capHole = (strokes, par) => Math.min(strokes, par + 3);

/*
 * Strokes a unit receives on one hole, allocated by stroke index off the
 * President's Reserve card. A 23 handicap takes two shots on the five hardest
 * holes and one on the rest; a 12 takes one shot on stroke index 1 through 12.
 * Summed across eighteen holes this always equals the playing handicap, which
 * is what makes a running net agree with the finished net exactly.
 */
function strokesOnHole(handicap, strokeIndex) {
  if (handicap <= 0) return 0;
  const loops = Math.floor(handicap / 18);
  return strokeIndex <= handicap - loops * 18 ? loops + 1 : loops;
}

async function buildState(request, env) {
  const roster = await getRoster(request, env);
  const cards = await readCards(env);
  const r = roster.raw;

  const units = roster.units.map((u) => {
    const card = cards[u.id];
    const holes = card ? card.holes : new Array(18).fill(null);
    const played = holes.filter((h) => h !== null).length;
    const complete = played === 18;

    /* Gross is live from the first hole posted. */
    const gross = holes.reduce((sum, h) => (h === null ? sum : sum + h), 0);
    const adjusted = holes.reduce((sum, h, i) => (h === null ? sum : sum + capHole(h, roster.pars[i + 1])), 0);

    /* Running net over the holes actually played, with each hole's strokes
       allocated by stroke index. At eighteen holes this equals
       adjustedGross - handicap; before that it is a real, comparable figure
       rather than a partial total waiting on the rest of the card. */
    let netThrough = 0;
    let parPlayed = 0;
    holes.forEach((h, i) => {
      if (h === null) return;
      const hole = i + 1;
      netThrough += capHole(h, roster.pars[hole]) - strokesOnHole(u.handicap, roster.sidx[hole]);
      parPlayed += roster.pars[hole];
    });

    return {
      id: u.id,
      label: u.label,
      kind: u.kind,
      team: u.team,
      members: u.members,
      handicap: u.handicap,
      /* Hole-by-hole gross is public the moment it is posted — same rule as the
         running gross total. Only net is withheld. */
      holes,
      holesPlayed: played,
      gross,
      adjustedGross: adjusted,
      complete,
      /* Live from the first hole posted. */
      netThrough: played ? netThrough : null,
      parPlayed: played ? parPlayed : null,
      /* Net relative to the par of the holes played — the figure that compares
         fairly between two men who are through different numbers of holes. */
      toPar: played ? netThrough - parPlayed : null,
      /* The official 18-hole net. Only exists once the card is finished. */
      net: complete ? adjusted - u.handicap : null,
      updatedAt: card ? card.updatedAt : null
    };
  });

  const byTeam = {};
  for (const t of r.teams) {
    const mine = units.filter((u) => u.team === t.id);
    const done = mine.filter((u) => u.complete);
    const allIn = done.length === mine.length;

    /* Live "currently the drop": worst net-to-par among everyone who has posted
       anything at all, so the slot moves from the first hole rather than
       waiting for finished cards. Once every card is in, to-par and net rank
       identically (to-par is just net minus 72), so this is the same answer
       the final standings give. */
    const started = mine.filter((u) => u.holesPlayed > 0);
    const ranked = [...started].sort((a, b) => a.toPar - b.toPar);
    const dropId = ranked.length ? ranked[ranked.length - 1].id : null;
    const byNet = [...done].sort((a, b) => a.net - b.net);

    byTeam[t.id] = {
      id: t.id,
      name: t.name,
      short: t.short,
      unitsIn: done.length,
      unitsTotal: mine.length,
      allIn,
      dropUnitId: dropId,
      /* A team's drop is settled once that team's seven cards are in — it does
         not depend on the other team. The total does. */
      dropIsFinal: allIn,
      _best: allIn ? byNet.slice(0, r.format.countBestUnits).reduce((s, u) => s + u.net, 0) : null,
      total: null
    };
  }

  const everyoneIn = Object.values(byTeam).every((t) => t.allIn);

  /* Rule 3: no team total until ALL cards are in, on both teams. Publishing one
     team's number while the other is still out on the course hands the second
     team a target to play to, which is not the game that was agreed. */
  for (const t of Object.values(byTeam)) {
    t.total = everyoneIn ? t._best : null;
    delete t._best;
  }
  let result = null;
  if (everyoneIn) {
    const [a, b] = r.teams.map((t) => byTeam[t.id]);
    const margin = Math.abs(a.total - b.total);
    result =
      a.total === b.total
        ? { tie: true, margin: 0 }
        : { tie: false, winner: a.total < b.total ? a.id : b.id, loser: a.total < b.total ? b.id : a.id, margin };
  }

  /* Duels run live and lock the moment both cards are complete. */
  const unitFor = (label) => units.find((u) => u.label === label);
  const duels = r.duels.map((d) => {
    const ru = unitFor(d.ryobi);
    const bu = unitFor(d.blackdecker);
    const settled = Boolean(ru && bu && ru.complete && bu.complete);

    /* Live standing over the holes BOTH men have played. Comparing a man
       through twelve against a man through six would say more about pace of
       play than about golf. */
    let through = 0;
    let liveRyobi = 0;
    let liveBd = 0;
    if (ru && bu) {
      for (let i = 0; i < 18; i++) {
        if (ru.holes[i] === null || bu.holes[i] === null) continue;
        const hole = i + 1;
        const par = roster.pars[hole];
        const si = roster.sidx[hole];
        liveRyobi += capHole(ru.holes[i], par) - strokesOnHole(ru.handicap, si);
        liveBd += capHole(bu.holes[i], par) - strokesOnHole(bu.handicap, si);
        through++;
      }
    }
    const margin = liveBd - liveRyobi; // positive = Ryobi ahead
    const leader = through === 0 ? null : margin > 0 ? 'ryobi' : margin < 0 ? 'blackdecker' : 'tie';

    let winner = null;
    if (settled) {
      if (ru.net < bu.net) winner = 'ryobi';
      else if (bu.net < ru.net) winner = 'blackdecker';
      else winner = 'tie';
    }

    return {
      id: d.id,
      ryobi: d.ryobi,
      ryobiHdcp: d.ryobiHdcp,
      ryobiNet: settled ? ru.net : null,
      blackdecker: d.blackdecker,
      bdHdcp: d.bdHdcp,
      bdNet: settled ? bu.net : null,
      strokes: d.strokes,
      givenTo: d.givenTo,
      /* Live: holes both have played, each man's net over those holes, and who
         is up by how many. */
      through,
      liveRyobiNet: through ? liveRyobi : null,
      liveBdNet: through ? liveBd : null,
      leader,
      margin: through ? Math.abs(margin) : null,
      ryobiThrough: ru ? ru.holesPlayed : 0,
      bdThrough: bu ? bu.holesPlayed : 0,
      settled,
      winner
    };
  });

  return { units, teams: byTeam, result, duels, everyoneIn, asOf: new Date().toISOString() };
}

/* ── plumbing ─────────────────────────────────────────────────────────────── */
const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Scorer-Key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
});

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors() }
  });
