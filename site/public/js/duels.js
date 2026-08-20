import { chrome, badge, esc } from './site.js';
import { DUELS } from './jabs.js';
import { duelRow } from './duelrow.js';

const r = await chrome();

/* One small badge at the head of each column. Never repeated per row. */
document.querySelector('[data-duelhead]').innerHTML =
  `<div data-team="ryobi">${badge(r.teamById.ryobi, 'default', 'badge--sm')}</div>` +
  `<div class="mid">Low net over 18</div>` +
  `<div data-team="blackdecker">${badge(r.teamById.blackdecker, 'default', 'badge--sm')}</div>`;

/*
 * Deliberately absent from this page: cart numbers, tee groups, and any
 * "are these two playing together" indicator. The duels and the carts are
 * independent by design and this page does not reopen that argument.
 */
document.querySelector('[data-duels]').innerHTML = r.duels
  .map(
    (d) => `
    <article class="duel">
      <div class="duel-top">
        <div class="duel-man r">
          <div class="who">${esc(d.ryobi)}</div>
          <div class="hd">Playing ${d.ryobiHdcp}</div>
        </div>
        <div class="duel-no">Duel ${d.id}</div>
        <div class="duel-man b">
          <div class="who">${esc(d.blackdecker)}</div>
          <div class="hd">Playing ${d.bdHdcp}</div>
        </div>
      </div>
      <div class="duel-strokes">
        ${
          d.strokes === 0
            ? '<span class="even">Scratch — no strokes given</span>'
            : `<span><b>${d.strokes}</b> stroke${d.strokes === 1 ? '' : 's'} to <b>${esc(d.givenTo)}</b></span>`
        }
        <span>${d.id === 7 ? '2-man scramble' : 'Singles'}</span>
        <span>Side wager: private</span>
      </div>
      ${DUELS[d.id] ? `<p class="duel-note">${esc(DUELS[d.id])}</p>` : ''}
    </article>`
  )
  .join('');

/*
 * Live results. The matchups above are the fixture list; this is the state of
 * play, drawn with the same row the Scoreboard uses so the two pages cannot
 * contradict each other.
 */
const board = document.querySelector('[data-live]');

async function tick() {
  let state;
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) throw new Error(`api ${res.status}`);
    state = await res.json();
  } catch {
    board.innerHTML = '<p class="note">Scoreboard unreachable — matchups above are unaffected.</p>';
    return;
  }

  const started = state.duels.some((d) => d.through > 0 || d.settled);
  if (!started) {
    board.innerHTML =
      '<p class="note">Nothing posted yet. Duels appear here hole by hole once cards start going in, ' +
      'and lock when both men finish.</p>';
    return;
  }

  const done = state.duels.filter((d) => d.settled).length;
  board.innerHTML =
    `<p class="kicker" style="margin-bottom:.6rem">${done} of ${state.duels.length} settled</p>` +
    state.duels.map((d) => duelRow(d, esc)).join('');
}

tick();
setInterval(tick, 20000);
