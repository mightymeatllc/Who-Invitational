import { chrome, badge, esc } from './site.js';
import { money } from './data.js';

const roster = await chrome();
const $ = (sel) => document.querySelector(sel);

let revealed = false; // Winners' Circle animation fires once, not on every poll.

async function tick() {
  let state;
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) throw new Error(`api ${res.status}`);
    state = await res.json();
  } catch (err) {
    $('[data-status]').innerHTML =
      `<span class="dot"></span><span>Scoreboard offline — ${esc(err.message)}</span>`;
    return;
  }
  render(state);
}

function render(s) {
  const inCount = s.units.filter((u) => u.complete).length;
  $('[data-status]').innerHTML =
    `<span class="dot ${s.everyoneIn ? '' : 'live'}"></span>` +
    `<span>${s.everyoneIn ? 'Final' : 'Live'}</span>` +
    `<span>${inCount} of ${s.units.length} cards in</span>` +
    `<span>Net hidden until 18 holes are posted</span>`;

  renderWinners(s);
  renderDrops(s);
  renderUnits(s);
  renderDuels(s);
}

/* ── A. Winners' Circle ───────────────────────────────────────────────────── */
function renderWinners(s) {
  const host = $('[data-winners]');
  if (!s.result) {
    const left = s.units.length - s.units.filter((u) => u.complete).length;
    host.innerHTML =
      `<div class="panel" style="text-align:center;padding:30px 18px">` +
      `<div class="kicker">Winners' Circle</div>` +
      `<p style="margin-top:12px;color:var(--text-dim)">Sealed until all fourteen units are in. ` +
      `${left} card${left === 1 ? '' : 's'} outstanding.</p></div>`;
    return;
  }

  if (s.result.tie) {
    host.innerHTML =
      `<div class="panel" style="text-align:center;padding:30px 18px">` +
      `<h2 style="font-size:clamp(30px,9vw,60px);text-transform:uppercase">Dead heat</h2>` +
      `<p style="margin-top:10px;color:var(--text-dim)">Both teams on ${s.teams.ryobi.total}. ` +
      `The pot does not split, the committee settles nothing, and the sixteen of you can sort it out at the pool.</p></div>`;
    return;
  }

  const w = s.teams[s.result.winner];
  const l = s.teams[s.result.loser];
  const team = roster.teamById[w.id];
  const winners = roster.playersForTeam(w.id).map((p) => p.name);
  const share = money(roster.format.pot / 8);

  host.innerHTML = `
    <div class="winners" data-team="${w.id}">
      <div class="crown">Winner &mdash; The Who? Invitational Open</div>
      ${badge(team, 'transparent')}
      <h2>${esc(w.name)}</h2>
      <div class="margin">Best 6 of 7: <b>${w.total}</b> &nbsp;·&nbsp; by <b>${s.result.margin}</b> stroke${s.result.margin === 1 ? '' : 's'}</div>
      <div class="payout">${share} a man</div>
      <ul class="eight">${winners.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>
    <div class="losers"><span>${esc(l.name)}</span><b>${l.total}</b></div>`;

  if (!revealed) {
    revealed = true;
    confetti(getComputedStyle(host.querySelector('.winners')).getPropertyValue('--team').trim());
  }
}

/* ── B. The Drop ──────────────────────────────────────────────────────────── */
function renderDrops(s) {
  const host = $('[data-drops]');
  host.innerHTML = roster.teams
    .map((t) => {
      const ts = s.teams[t.id];
      const unit = s.units.find((u) => u.id === ts.dropUnitId);

      if (!unit) {
        return `<article class="drop is-provisional" data-team="${t.id}">
            <div class="title">The Drop &mdash; ${esc(t.short)}</div>
            <h3 style="text-decoration:none">Pending</h3>
            <div class="verdict">No completed cards yet. Somebody on this team is about to be named here and every one of them knows it.</div>
          </article>`;
      }

      /* How many strokes clear of relevance he was: the gap to the worst score
         that actually counted. */
      const counting = s.units
        .filter((u) => u.team === t.id && u.complete && u.id !== unit.id)
        .sort((a, b) => a.net - b.net);
      const worstCounting = counting.length ? counting[counting.length - 1].net : null;
      const clear = worstCounting === null ? null : unit.net - worstCounting;

      const sub = unit.kind === 'scramble' ? unit.members.join(' + ') : null;

      const verdict = ts.dropIsFinal
        ? `${unit.kind === 'scramble' ? 'Two men, one ball,' : 'Eighteen holes,'} and not one shot of it counted. ` +
          `${unit.kind === 'scramble' ? 'Their round' : 'His round'} has been thrown away — the team scored the other six and did it without ` +
          `${unit.kind === 'scramble' ? 'them' : 'him'}.` +
          (clear === null ? '' : ` ${clear} stroke${clear === 1 ? '' : 's'} clear of relevance.`)
        : `Currently contributing nothing. This slot updates as cards come in, so there is still time — ` +
          `not much, and not for everyone, but some.`;

      return `<article class="drop${ts.dropIsFinal ? '' : ' is-provisional'}" data-team="${t.id}">
          ${badge(roster.teamById[t.id], 'default', 'badge--sm')}
          <div class="title">${ts.dropIsFinal ? 'Biggest Loser' : 'Currently the drop'} &mdash; ${esc(t.short)}</div>
          <h3>${esc(unit.label)}</h3>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
          <div class="fig">
            <span>Gross<b>${unit.adjustedGross}</b></span>
            <span>Hdcp<b>${unit.handicap}</b></span>
            <span>Net<b>${unit.net}</b></span>
            ${clear === null ? '' : `<span>Clear of relevance<b>+${clear}</b></span>`}
          </div>
          <div class="verdict">${esc(verdict)}</div>
        </article>`;
    })
    .join('');
}

/* ── Live cards, current drop marked ──────────────────────────────────────── */
function renderUnits(s) {
  $('[data-units]').innerHTML = roster.teams
    .map((t) => {
      const ts = s.teams[t.id];
      const mine = s.units.filter((u) => u.team === t.id);
      return `
        <div data-team="${t.id}">
          <div class="duelhead" style="margin-bottom:10px">
            ${badge(roster.teamById[t.id], 'default', 'badge--sm')}
            <span class="mid">${ts.unitsIn}/${ts.unitsTotal} in</span>
            <span></span>
          </div>
          <div class="units">
            ${mine
              .map(
                (u) => `<div class="unit${u.id === ts.dropUnitId ? ' is-drop' : ''}">
                  <span class="who">${esc(u.label)}${
                    u.id === ts.dropUnitId
                      ? `<em class="droptag">${ts.dropIsFinal ? 'Dropped' : 'Currently the drop'}</em>`
                      : ''
                  }${u.kind === 'scramble' ? `<small>${esc(u.members.join(' + '))}</small>` : ''}</span>
                  <span class="v">${u.holesPlayed ? u.gross : '&mdash;'}</span>
                  <span class="v">${u.handicap}</span>
                  <span class="v ${u.complete ? 'net' : 'pending'}">${
                    u.complete ? u.net : `${u.holesPlayed}/18`
                  }</span>
                </div>`
              )
              .join('')}
            <div class="teamtotal">
              <span class="lbl">Best ${roster.format.countBestUnits} of ${roster.format.scoringUnitsPerTeam}</span>
              <span class="val">${ts.total === null ? '&mdash;' : ts.total}</span>
            </div>
          </div>
        </div>`;
    })
    .join('');
}

/* ── C. Duel by duel ──────────────────────────────────────────────────────── */
function renderDuels(s) {
  $('[data-duels]').innerHTML = s.duels
    .map((d) => {
      const rWon = d.settled && d.winner === 'ryobi';
      const bWon = d.settled && d.winner === 'blackdecker';
      const tie = d.settled && d.winner === 'tie';
      const cls = (side) =>
        !d.settled ? '' : tie ? '' : (side === 'r' ? rWon : bWon) ? ' won' : ' lost';

      const mid = !d.settled
        ? `Duel ${d.id}<br>${d.strokes === 0 ? 'Scratch' : `${d.strokes} to ${esc(d.givenTo)}`}`
        : tie
        ? `<span class="tie">TIE</span>`
        : `Duel ${d.id}<br>${d.strokes === 0 ? 'Scratch' : `${d.strokes} to ${esc(d.givenTo)}`}`;

      return `<div class="duelrow">
          <div class="side r${cls('r')}">
            <div class="who">${esc(d.ryobi)}</div>
            <div class="netv">${d.settled ? `net ${d.ryobiNet}` : `plays ${d.ryobiHdcp}`}</div>
          </div>
          <div class="mid">${mid}</div>
          <div class="side b${cls('b')}">
            <div class="who">${esc(d.blackdecker)}</div>
            <div class="netv">${d.settled ? `net ${d.bdNet}` : `plays ${d.bdHdcp}`}</div>
          </div>
        </div>`;
    })
    .join('');
}

/* ── Confetti, once ───────────────────────────────────────────────────────── */
function confetti(teamColor) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = [teamColor || '#d3d812', '#ffffff', '#9a988f'];
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.6,
    w: 5 + Math.random() * 7,
    h: 8 + Math.random() * 12,
    vy: 2 + Math.random() * 3.4,
    vx: -1.2 + Math.random() * 2.4,
    rot: Math.random() * Math.PI,
    vr: -0.16 + Math.random() * 0.32,
    c: colors[(Math.random() * colors.length) | 0]
  }));

  const started = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (now - started < 6500) requestAnimationFrame(frame);
    else cv.remove();
  })(started);
}

tick();
setInterval(tick, 20000);
