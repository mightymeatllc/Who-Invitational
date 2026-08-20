import { chrome, badge, esc } from './site.js';

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
    </article>`
  )
  .join('');
