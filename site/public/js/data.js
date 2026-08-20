/*
 * Single roster loader. Every page on this site gets its player data from here
 * and nowhere else — there is exactly one copy of the roster, at
 * data/roster.json, and it is the source of truth.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MILO CONTINGENCY — read before editing the roster
 *
 * Milo is OUT pending a knee decision. If he plays, he takes Adam's seat and
 * Adam is out; the field stays at 16. Swap the single Adam record in
 * data/roster.json for Milo (index 25.0, playing 23, estimate: true) and every
 * page on this site updates itself — teams, duels, carts, jabs, scoreboard.
 * Also uncomment the Milo entry in js/jabs.js.
 *
 * ⚠ WARNING: that swap is not balanced. Adam plays off 10; Milo plays off a
 * committee 23. Ryobi's strokes given moves 90 → 103 against Black & Decker's
 * 91 — a 12-stroke spread where the committee's own rule of thumb is ±2.
 * Rebalance the teams before publishing, or the tournament is decided on the
 * first tee. See _pending.milo.warning in data/roster.json.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let _cache = null;

export async function loadRoster() {
  if (_cache) return _cache;
  const res = await fetch('/data/roster.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`roster.json ${res.status}`);
  _cache = decorate(await res.json());
  return _cache;
}

/* Derived views. Nothing here invents data; it only reshapes roster.json. */
function decorate(r) {
  const teamById = Object.fromEntries(r.teams.map((t) => [t.id, t]));

  const players = r.players.map((p) => ({
    ...p,
    teamRef: teamById[p.team],
    duelRef: r.duels.find((d) => d.id === p.duel) || null,
    cartRef: r.carts.find((c) => c.riders.includes(p.name)) || null,
    pairRef: r.scramblePairs.find((s) => s.players.includes(p.name)) || null
  }));

  const byName = Object.fromEntries(players.map((p) => [p.name, p]));

  /* The seven scoring units per team: six individuals + one scramble pair. */
  const units = [];
  for (const t of r.teams) {
    for (const p of players.filter((x) => x.team === t.id && x.playsAs === 'individual')) {
      units.push({
        id: `${t.id}-${p.name.toLowerCase()}`,
        label: p.name,
        kind: 'individual',
        team: t.id,
        handicap: p.handicap,
        tee: p.tee,
        members: [p.name]
      });
    }
    const pair = r.scramblePairs.find((s) => s.team === t.id);
    if (pair) {
      units.push({
        id: pair.id,
        label: pair.name,
        kind: 'scramble',
        team: t.id,
        handicap: pair.handicap, // committee number — never recomputed
        tee: pair.tee,
        members: pair.players.slice()
      });
    }
  }

  /* Opponent lookup. Scramble men point at the other pair. */
  const opponentOf = (name) => {
    const p = byName[name];
    if (!p || !p.duelRef) return null;
    const d = p.duelRef;
    return p.team === 'ryobi' ? d.blackdecker : d.ryobi;
  };

  return {
    ...r,
    teamById,
    players,
    byName,
    units,
    opponentOf,
    unitsForTeam: (id) => units.filter((u) => u.team === id),
    playersForTeam: (id) => players.filter((p) => p.team === id),
    parForHole: (hole) => (r.course.holes.find((h) => h.hole === hole) || {}).par ?? 4
  };
}

/* Triple bogey max. Applied to a single hole's gross. */
export function capHole(strokes, par) {
  const max = par + 3;
  return Math.min(Number(strokes) || 0, max);
}

export const money = (n) => `$${Number(n).toLocaleString('en-US')}`;
