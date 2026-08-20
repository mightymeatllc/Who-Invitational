import { chrome, esc } from './site.js';
import { money } from './data.js';
import { CARTS } from './jabs.js';

const r = await chrome();

const f = r.format;
const facts = [
  ['The Field', `${f.teams} teams &times; ${f.playersPerTeam}`, '16 men, one round'],
  ['Scoring', `Best ${f.countBestUnits} of ${f.scoringUnitsPerTeam}`, 'Worst unit dropped and named'],
  ['Max per hole', f.maxScorePerHole, `Playing handicap ${f.handicapAllowance * 100}% of index`],
  ['Tees', `${f.defaultTee} / ${f.scrambleTee}`, `Scramble pairs play ${f.scrambleTee} (${f.courseRating.white}) — the field plays ${f.defaultTee} (${f.courseRating.blue})`],
  ['Strokes given', `${f.strokesGiven.Ryobi} &ndash; ${f.strokesGiven['Black & Decker']}`, 'Ryobi &ndash; Black &amp; Decker'],
  ['The pot', money(f.pot), `${money(f.entryFee)} a man, winner take all`]
];
document.querySelector('[data-facts]').innerHTML = facts
  .map(([dt, dd, sub]) => `<div class="fact"><dt>${dt}</dt><dd>${dd}<small>${sub}</small></dd></div>`)
  .join('');

document.querySelector('[data-money]').innerHTML =
  `<p><b>${money(f.entryFee)} a man. ${money(f.pot)} in the pot. Winner take all.</b></p>` +
  `<p>The winning eight split it: ${money(f.pot / 8)} back, ${money(f.pot / 8 - f.entryFee)} profit each. The losing eight are out ${money(f.entryFee)} and get a story instead.</p>` +
  `<p>No second place. No low-net carve-out. No consolation. One pot, one winner, eight men who paid ${money(f.entryFee)} to be publicly ranked.</p>` +
  `<p class="note">Duel money is private. Wager whatever the two of you agree to — the committee holds none of it and settles none of it.</p>`;

const carts = document.querySelector('[data-carts]');
carts.innerHTML =
  '<thead><tr><th class="num">Cart</th><th>Riders</th><th>Off</th><th>The committee notes</th></tr></thead><tbody>' +
  r.carts
    .map((c) => {
      const off = { A: '9:00', B: '9:10', C: '9:20', D: '9:30' }[c.group] || '';
      return `<tr>
        <td class="num">${c.cart}</td>
        <td class="name">${esc(c.riders.join(' / '))}<small class="grp">Group ${esc(c.group)}</small></td>
        <td class="num">${off}</td>
        <td class="jabcell">${esc(CARTS[c.cart] || '')}</td>
      </tr>`;
    })
    .join('') +
  '</tbody>';
