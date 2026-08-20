/*
 * Pre-flight. Runs the real Worker against an in-memory KV and asserts the
 * scoring rules the tournament actually depends on. Run before any deploy:
 *   npm run check
 */
import worker from '../site/src/index.js';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = new URL('../site/public/', import.meta.url).pathname;
const TYPES = { '.json': 'application/json; charset=utf-8' };
const ASSETS = {
  async fetch(request) {
    const p = new URL(request.url).pathname;
    try {
      return new Response(await readFile(join(ROOT, p)), {
        headers: { 'Content-Type': TYPES[extname(p)] || 'text/plain' }
      });
    } catch {
      return new Response('not found', { status: 404 });
    }
  }
};
const store = new Map();
const SCORES = {
  async get(k) { return store.get(k) ?? null; },
  async put(k, v) { store.set(k, v); },
  async delete(k) { store.delete(k); },
  async list({ prefix = '' } = {}) {
    return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
  }
};
const env = { ASSETS, SCORES, SCORER_KEY: 'test-key' };

const call = (path, init = {}) =>
  worker.fetch(new Request('http://x' + path, init), env, {});
const state = async () => (await call('/api/state')).json();
const post = (unitId, holes, key = 'test-key') =>
  call('/api/card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Scorer-Key': key },
    body: JSON.stringify({ unitId, holes })
  });

let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); failed++; }
};

const roster = JSON.parse(await readFile(join(ROOT, 'data/roster.json'), 'utf8'));
const PARS = roster.course.holes.map((h) => h.par);
const flat = (n) => PARS.map(() => n);

console.log('\nroster integrity');
{
  const names = roster.players.map((p) => p.name);
  ok('16 players', names.length === 16, `got ${names.length}`);
  ok('no duplicate names', new Set(names).size === 16);
  ok('8 per team', roster.teams.every((t) => roster.players.filter((p) => p.team === t.id).length === 8));
  ok('4 scramble men', roster.players.filter((p) => p.playsAs === 'scramble').length === 4);
  ok('every player has a duel', roster.players.every((p) => roster.duels.some((d) => d.id === p.duel)));
  ok('every player has a cart', roster.players.every((p) => roster.carts.some((c) => c.riders.includes(p.name))));
  ok('scramble pairs hardcoded to 12', roster.scramblePairs.every((s) => s.handicap === 12));
  ok('scramble men play White', roster.players.filter((p) => p.playsAs === 'scramble').every((p) => p.tee === 'White'));
  ok('everyone else plays Blue', roster.players.filter((p) => p.playsAs === 'individual').every((p) => p.tee === 'Blue'));

  // playing handicap = round(index * 0.9), index capped at 25
  const bad = roster.players.filter((p) => {
    const idx = Math.min(p.index, roster.format.indexCap);
    return p.handicap !== Math.round(idx * roster.format.handicapAllowance);
  });
  ok('playing handicaps are 90% of index', bad.length === 0, bad.map((p) => p.name).join(', '));

  // strokes given per team: six individuals + the pair
  for (const t of roster.teams) {
    const sum =
      roster.players.filter((p) => p.team === t.id && p.playsAs === 'individual').reduce((a, p) => a + p.handicap, 0) +
      roster.scramblePairs.find((s) => s.team === t.id).handicap;
    ok(`${t.short} strokes given = ${roster.format.strokesGiven[t.short]}`, sum === roster.format.strokesGiven[t.short], `computed ${sum}`);
  }

  // duel stroke arithmetic
  const duelBad = roster.duels.filter((d) => Math.abs(d.ryobiHdcp - d.bdHdcp) !== d.strokes);
  ok('duel strokes = handicap difference', duelBad.length === 0, duelBad.map((d) => d.id).join(','));
  const givenBad = roster.duels.filter((d) => {
    if (d.strokes === 0) return d.givenTo !== null;
    return d.givenTo !== (d.ryobiHdcp > d.bdHdcp ? d.ryobi : d.blackdecker);
  });
  ok('strokes go to the higher handicap', givenBad.length === 0, givenBad.map((d) => d.id).join(','));
}

console.log('\ncourse card');
{
  const h = roster.course.holes;
  ok('18 holes', h.length === 18);
  ok('par totals 72', h.reduce((a, x) => a + x.par, 0) === roster.course.par);
  ok('out is 36', h.slice(0, 9).reduce((a, x) => a + x.par, 0) === 36);
  ok('in is 36', h.slice(9).reduce((a, x) => a + x.par, 0) === 36);
  ok('holes numbered 1-18 in order', h.every((x, i) => x.hole === i + 1));
  ok('every par is 3, 4 or 5', h.every((x) => [3, 4, 5].includes(x.par)));
  const si = h.map((x) => x.strokeIndex).sort((a, b) => a - b);
  ok('stroke index is 1-18, each once', si.every((v, i) => v === i + 1));
  ok('card is marked verified', roster.course.verified === true,
     'placeholder data must not reach a deploy');
}

console.log('\nscramble pairs');
{
  // Committee number. It must survive the whole pipeline untouched — the White
  // tee giveback is already inside it and must never be applied a second time.
  const s0 = await state();
  const pairs = s0.units.filter((u) => u.kind === 'scramble');
  ok('two scramble units', pairs.length === 2);
  ok('both come back off the API at 12', pairs.every((u) => u.handicap === 12),
     pairs.map((u) => `${u.label}=${u.handicap}`).join(' '));
  ok('each pair is two men scoring as one unit', pairs.every((u) => u.members.length === 2));
  ok('the giveback is not applied twice', pairs.every((u) => u.handicap === roster.format.scramblePairHandicap));

  // Net for a pair is adjusted gross minus 12, nothing else.
  store.clear();
  const parTotal = PARS.reduce((a, b) => a + b, 0);
  await post('ryobi-scramble', PARS.map((p) => p + 1)); // one over on every hole
  const u = (await state()).units.find((x) => x.id === 'ryobi-scramble');
  ok('pair net is adjusted gross minus 12', u.net === parTotal + 18 - 12,
     `got ${u.net} want ${parTotal + 18 - 12}`);
  store.clear();
}

console.log('\nscoring reads par and nothing else');
{
  // If any rating or slope crept into the maths, a card of straight pars would
  // not come back at exactly par.
  store.clear();
  await post('ryobi-dan', PARS.slice());
  const u = (await state()).units.find((x) => x.id === 'ryobi-dan');
  ok('a card of straight pars is gross 72', u.adjustedGross === 72, `got ${u.adjustedGross}`);
  ok('and nets exactly 72 minus the handicap', u.net === 72 - 16, `got ${u.net}`);
  store.clear();
}

console.log('\nauth');
ok('POST without a key is rejected', (await post('ryobi-jipp', flat(4), 'wrong')).status === 401);

console.log('\nrule 1 — gross is live, rule 2 — net is sealed until 18');
{
  const partial = PARS.map((p, i) => (i < 9 ? p : null));
  await post('ryobi-jipp', partial);
  const s = await state();
  const u = s.units.find((x) => x.id === 'ryobi-jipp');
  ok('gross posts after 9 holes', u.gross === PARS.slice(0, 9).reduce((a, b) => a + b, 0), `got ${u.gross}`);
  ok('net withheld at 9 holes', u.net === null);
  ok('holesPlayed reported', u.holesPlayed === 9);
  ok('team total withheld', s.teams.ryobi.total === null);
}

console.log('\ntriple bogey cap');
{
  await post('ryobi-adam', PARS.map((p) => p + 9)); // nines everywhere
  const s = await state();
  const u = s.units.find((x) => x.id === 'ryobi-adam');
  const expected = PARS.reduce((a, p) => a + p + 3, 0);
  ok('gross keeps what was actually shot', u.gross === PARS.reduce((a, p) => a + p + 9, 0));
  ok('adjusted gross capped at triple bogey', u.adjustedGross === expected, `got ${u.adjustedGross} want ${expected}`);
  ok('net uses the capped figure', u.net === expected - 10, `got ${u.net}`);
}

console.log('\ncap is per hole, not off a flat par');
{
  store.clear();
  const parTotal = PARS.reduce((a, b) => a + b, 0);

  // An all-9s card cannot prove this: average par here is exactly 4, so a flat
  // par-4 cap gives the same total as a per-hole cap. Blow up one hole at a
  // time instead, on a par 3 and on a par 5, where the two differ.
  const par3 = roster.course.holes.find((h) => h.par === 3).hole;
  const par5 = roster.course.holes.find((h) => h.par === 5).hole;

  await post('ryobi-neels', PARS.map((p, i) => (i + 1 === par3 ? 9 : p)));
  let u = (await state()).units.find((x) => x.id === 'ryobi-neels');
  let perHole = parTotal - 3 + 6;   // capped at that hole's par + 3
  let flat = parTotal - 3 + 7;      // what a flat par-4 cap would give
  ok(`blow-up on par 3 (hole ${par3}) caps at 6`, u.adjustedGross === perHole,
     `got ${u.adjustedGross} want ${perHole}`);
  ok('a flat par-4 cap would differ', perHole !== flat);

  await post('ryobi-pat', PARS.map((p, i) => (i + 1 === par5 ? 15 : p)));
  u = (await state()).units.find((x) => x.id === 'ryobi-pat');
  perHole = parTotal - 5 + 8;
  flat = parTotal - 5 + 7;
  ok(`blow-up on par 5 (hole ${par5}) caps at 8`, u.adjustedGross === perHole,
     `got ${u.adjustedGross} want ${perHole}`);
  ok('a flat par-4 cap would differ', perHole !== flat);

  store.clear();
}

console.log('\nrunning net');
{
  store.clear();
  const SI = Object.fromEntries(roster.course.holes.map((h) => [h.hole, h.strokeIndex]));
  const strokesOnHole = (hcp, si) => {
    if (hcp <= 0) return 0;
    const loops = Math.floor(hcp / 18);
    return si <= hcp - loops * 18 ? loops + 1 : loops;
  };

  // The allocation must sum to the handicap for every unit, or a running net
  // could never agree with the finished net.
  for (const h of [3, 10, 12, 16, 21, 23]) {
    const total = roster.course.holes.reduce((a, x) => a + strokesOnHole(h, SI[x.hole]), 0);
    ok(`handicap ${h} allocates to exactly ${h} strokes`, total === h, `got ${total}`);
  }

  // Net posts from the very first hole.
  await post('ryobi-landon', PARS.map((p, i) => (i === 0 ? p + 2 : null)));
  let u = (await state()).units.find((x) => x.id === 'ryobi-landon');
  ok('net exists after one hole', u.netThrough !== null);
  ok('one hole reported', u.holesPlayed === 1);
  ok('team total still sealed', (await state()).teams.ryobi.total === null);

  // Half a card.
  await post('ryobi-landon', PARS.map((p, i) => (i < 9 ? p + 1 : null)));
  u = (await state()).units.find((x) => x.id === 'ryobi-landon');
  const front = PARS.slice(0, 9);
  const expectFront = front.reduce((a, p, i) => a + (p + 1) - strokesOnHole(23, SI[i + 1]), 0);
  ok('running net through 9 is right', u.netThrough === expectFront, `got ${u.netThrough} want ${expectFront}`);
  ok('to-par through 9 is right', u.toPar === expectFront - front.reduce((a, b) => a + b, 0));
  ok('the 18-hole net is still withheld', u.net === null);

  // THE invariant: finish the card and the running net must land exactly on
  // the official net. If allocation and handicap ever disagree, this breaks.
  await post('ryobi-landon', PARS.map((p) => p + 1));
  u = (await state()).units.find((x) => x.id === 'ryobi-landon');
  ok('running net equals the finished net', u.netThrough === u.net, `${u.netThrough} vs ${u.net}`);
  ok('and equals adjusted gross minus handicap', u.net === u.adjustedGross - u.handicap);
  ok('to-par equals net minus 72', u.toPar === u.net - 72);
  store.clear();
}

console.log('\nlive drop and live duels');
{
  store.clear();
  // Two men on the same team, one hole each, one of them much worse.
  await post('ryobi-jipp', PARS.map((p, i) => (i === 0 ? p : null)));
  await post('ryobi-dan', PARS.map((p, i) => (i === 0 ? p + 6 : null)));
  let s2 = await state();
  ok('the drop is named from the first hole', s2.teams.ryobi.dropUnitId !== null);
  ok('and it is the man playing badly', s2.teams.ryobi.dropUnitId === 'ryobi-dan',
     `got ${s2.teams.ryobi.dropUnitId}`);
  ok('but it is not final', s2.teams.ryobi.dropIsFinal === false);

  // Duel 5 is Dan v Latex. Give Latex the same one hole, played well.
  await post('blackdecker-latex', PARS.map((p, i) => (i === 0 ? p : null)));
  s2 = await state();
  const d5 = s2.duels.find((d) => d.id === 5);
  ok('duel runs live from one common hole', d5.through === 1);
  ok('and names a leader', d5.leader === 'blackdecker', `got ${d5.leader}`);
  ok('with a margin', d5.margin > 0);
  ok('but is not settled', d5.settled === false && d5.winner === null);

  // A duel where only one man has posted must not claim a leader.
  const d1 = s2.duels.find((d) => d.id === 1);
  ok('one-sided duel has no common holes', d1.through === 0);
  ok('and names no leader', d1.leader === null);
  store.clear();
}

console.log('\nrule 3 — best 6 of 7, worst dropped');
{
  store.clear();
  const ids = [
    ['ryobi-jipp', 0], ['ryobi-adam', 0], ['ryobi-neels', 0], ['ryobi-pat', 0],
    ['ryobi-dan', 0], ['ryobi-landon', 0], ['ryobi-scramble', 9]  // pair shoots 9 over
  ];
  for (const [id, over] of ids) await post(id, PARS.map((p) => p + (over ? 1 : 0)));
  let s = await state();
  ok('no team total while the other team is still out', s.teams.ryobi.total === null);
  ok('this team\'s drop is settled once its seven are in', s.teams.ryobi.dropIsFinal === true);
  ok('the other team has no total yet either', s.teams.blackdecker.total === null);
  ok('the other team\'s drop is still provisional', s.teams.blackdecker.dropIsFinal === false);
  ok('no result declared', s.result === null);

  for (const t of ['blackdecker-joe','blackdecker-tito','blackdecker-meat','blackdecker-ron','blackdecker-latex','blackdecker-toe','bd-scramble'])
    await post(t, PARS.map((p) => p + 1));

  s = await state();
  ok('all 14 units in', s.everyoneIn === true);
  ok('drop is final once the team is in', s.teams.ryobi.dropIsFinal === true);

  const ry = s.units.filter((u) => u.team === 'ryobi').sort((a, b) => a.net - b.net);
  const expectTotal = ry.slice(0, 6).reduce((a, u) => a + u.net, 0);
  ok('team total is the best six', s.teams.ryobi.total === expectTotal, `got ${s.teams.ryobi.total} want ${expectTotal}`);
  ok('the dropped unit is the worst net', s.teams.ryobi.dropUnitId === ry[ry.length - 1].id);
  ok('the winning team still has a drop', s.teams[s.result.winner].dropUnitId !== null);
  ok('a result is declared', s.result !== null && typeof s.result.margin === 'number');
}

console.log('\nduels');
{
  const s = await state();
  ok('seven duels', s.duels.length === 7);
  ok('all settled once every card is in', s.duels.every((d) => d.settled));
  ok('winner matches low net', s.duels.every((d) =>
    d.ryobiNet < d.bdNet ? d.winner === 'ryobi' :
    d.bdNet < d.ryobiNet ? d.winner === 'blackdecker' : d.winner === 'tie'));
  const scramble = s.duels.find((d) => d.id === 7);
  ok('scramble pairs duel as one unit at 12', scramble.ryobiHdcp === 12 && scramble.bdHdcp === 12);
}

console.log('\nvalidation');
{
  const r1 = await post('ryobi-jipp', flat(4).slice(0, 17));
  ok('rejects a card that is not 18 holes', r1.status === 500 || r1.status === 400);
  const r2 = await post('nobody-here', flat(4));
  ok('rejects an unknown unit', r2.status === 500 || r2.status === 400);
  const r3 = await post('ryobi-jipp', PARS.map((_, i) => (i === 0 ? 0 : 4)));
  ok('rejects a zero on a hole', r3.status === 500 || r3.status === 400);
}

console.log(failed ? `\n${failed} FAILED\n` : '\nall checks passed\n');
process.exit(failed ? 1 : 0);
