import { chrome, badge, esc } from './site.js';
import { DOSSIERS } from './dossiers.js';

const r = await chrome();

/* Card order is the order the charges were filed, not the roster order —
   the sheet opens on the sandbagging case and closes on the host. */
const ORDER = [
  'Landon', 'Hulk', 'Rat', 'Meat', 'Dan', 'Adam', 'Terb', 'Joe',
  'Pat', 'Ron', 'Latex', 'Jipp', 'Tito', 'Neels', 'String', 'Toe'
];

const cardsFor = ORDER.filter((n) => DOSSIERS[n] && r.byName[n]);
const missing = Object.keys(DOSSIERS).filter((n) => !r.byName[n]);
if (missing.length) console.warn('Dossier with no roster entry (roster swap?):', missing.join(', '));

document.querySelector('[data-sheet]').innerHTML = cardsFor
  .map((name, i) => {
    const p = r.byName[name];
    const d = DOSSIERS[name];
    const opp = r.opponentOf(name);
    const t = p.teamRef;
    const wide = Boolean(d.counts);
    const caseNo = `WI-29-${String(i + 1).padStart(2, '0')}`;

    return `
      <article class="dossier${wide ? ' dossier--wide' : ''}" data-team="${p.team}">
        <div class="dossier-top">
          <div>
            <div class="dossier-no">Case ${caseNo}</div>
          </div>
          ${badge(t, 'default', 'badge--sm badge--stamp')}
        </div>

        <h3>${esc(p.name)}</h3>
        <div class="alias">a.k.a. ${esc(d.alias)}</div>

        <div class="charge"><span>Official charge</span>${esc(d.charge)}</div>

        <dl class="tape">
          <div>
            <dt>Index</dt>
            <dd>${p.index.toFixed(1)}${p.estimate ? ' <span class="est">EST</span>' : ''}</dd>
          </div>
          <div>
            <dt>Playing</dt>
            <dd>${p.handicap}</dd>
          </div>
          <div>
            <dt>Duel ${p.duel}</dt>
            <dd style="font-size:15px">${esc(opp || '—')}</dd>
          </div>
        </dl>

        <div class="body">${d.blurb.map((para) => `<p>${esc(para)}</p>`).join('')}</div>

        ${
          d.counts
            ? `<ul class="counts">${d.counts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
            : ''
        }
      </article>`;
  })
  .join('');
