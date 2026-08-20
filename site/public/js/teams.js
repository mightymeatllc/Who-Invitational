import { chrome, badge, esc } from './site.js';

const r = await chrome();

/* Primary logo placement: each team's roster sits under its badge, full width
   of the column. Nothing on this site renders a badge larger than this except
   the Winners' Circle. */
document.querySelector('[data-teams]').innerHTML = r.teams
  .map((t) => {
    const players = r.playersForTeam(t.id);
    const pair = r.scramblePairs.find((s) => s.team === t.id);
    const given = r.format.strokesGiven[t.short] ?? r.format.strokesGiven[t.name];
    return `
      <div class="teamcol" data-team="${t.id}">
        ${badge(t)}
        <h3>${esc(t.name)}</h3>
        <div class="strokes">${given} strokes given &nbsp;·&nbsp; 7 units &nbsp;·&nbsp; best 6 count</div>
        <ul class="roster">
          ${players
            .map(
              (p) => `<li${p.playsAs === 'scramble' ? ' class="is-scramble"' : ''}>
                <span class="who">${esc(p.name)}</span>
                <span class="role">${p.playsAs === 'scramble' ? 'Scramble · White' : 'Individual · Blue'}</span>
                <span class="hdcp">${p.handicap}</span>
              </li>`
            )
            .join('')}
          ${
            pair
              ? `<li class="is-scramble">
                   <span class="who">${esc(pair.name)}</span>
                   <span class="role">One unit · ${esc(pair.players.join(' + '))}</span>
                   <span class="hdcp">${pair.handicap}</span>
                 </li>`
              : ''
          }
        </ul>
      </div>`;
  })
  .join('');

const tape = document.querySelector('[data-tape]');
tape.innerHTML =
  '<thead><tr><th>Player</th><th class="num">Index</th><th class="num">Playing</th><th>Team</th><th>Plays as</th><th>Tee</th></tr></thead><tbody>' +
  [...r.players]
    .sort((a, b) => a.index - b.index)
    .map(
      (p) => `<tr data-team="${p.team}">
        <td class="name">${esc(p.name)}</td>
        <td class="num">${p.index.toFixed(1)}${p.estimate ? ' <span class="est">EST</span>' : ''}</td>
        <td class="num" style="color:var(--team)">${p.handicap}</td>
        <td>${esc(p.teamRef.short)}</td>
        <td>${p.playsAs === 'scramble' ? 'Scramble' : 'Individual'}</td>
        <td>${esc(p.tee)}</td>
      </tr>`
    )
    .join('') +
  '</tbody>';

const g = r.format.strokesGiven;
const spread = g.Ryobi - g['Black & Decker'];
document.querySelector('[data-spread]').innerHTML =
  `<p>Ryobi gives <b>${g.Ryobi}</b> strokes. Black &amp; Decker gives <b>${g['Black & Decker']}</b>. ` +
  `Spread: <b>${spread > 0 ? '+' : ''}${spread}</b> — inside the committee's &plusmn;2 and therefore a fair fight, ` +
  `which removes the last available excuse.</p>` +
  `<p class="note">Four committee estimates sit in this field at a playing 23 apiece. If any one of them is wrong, ` +
  `it is wrong by enough to decide the tournament, and everybody already knows which one this committee means.</p>`;
