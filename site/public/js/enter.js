import { chrome, esc } from './site.js';

const roster = await chrome();
const $ = (s) => document.querySelector(s);

$('#unit').innerHTML = roster.units
  .map((u) => {
    const t = roster.teamById[u.team];
    const who = u.kind === 'scramble' ? `${u.label} (${u.members.join(' + ')})` : u.label;
    return `<option value="${esc(u.id)}">${esc(t.short)} — ${esc(who)} · plays ${u.handicap} · ${esc(u.tee)}</option>`;
  })
  .join('');

const holeInput = (n) => {
  const par = roster.parForHole(n);
  return `<div class="hole">
      <label for="h${n}">${n}</label>
      <input id="h${n}" name="h${n}" type="number" inputmode="numeric" min="1" max="20" step="1">
      <span class="par">par ${par} · max ${par + 3}</span>
    </div>`;
};
$('[data-front]').innerHTML = Array.from({ length: 9 }, (_, i) => holeInput(i + 1)).join('');
$('[data-back]').innerHTML = Array.from({ length: 9 }, (_, i) => holeInput(i + 10)).join('');

/* Prefill from whatever is already posted for this unit, so a man adding the
   back nine does not have to retype the front. */
async function loadExisting() {
  const msg = $('[data-msg]');
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) return;
    const s = await res.json();
    const unit = s.units.find((u) => u.id === $('#unit').value);
    for (let i = 0; i < 18; i++) {
      document.getElementById(`h${i + 1}`).value =
        unit && unit.holes && unit.holes[i] != null ? unit.holes[i] : '';
    }
    msg.className = 'msg';
    msg.textContent = unit && unit.holesPlayed ? `${unit.holesPlayed} of 18 already posted for this unit.` : '';
  } catch {
    /* Offline is fine — post the card blank and it overwrites. */
  }
}
$('#unit').addEventListener('change', loadExisting);
loadExisting();

$('[data-form]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('[data-msg]');
  const holes = Array.from({ length: 18 }, (_, i) => {
    const v = document.getElementById(`h${i + 1}`).value.trim();
    return v === '' ? null : Number(v);
  });

  msg.className = 'msg';
  msg.textContent = 'Posting…';

  try {
    const res = await fetch('/api/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Scorer-Key': $('#key').value },
      body: JSON.stringify({ unitId: $('#unit').value, holes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const played = holes.filter((h) => h !== null).length;
    msg.className = 'msg ok';
    msg.textContent =
      played === 18
        ? 'Card complete. Net is now public and so is your position on the drop.'
        : `${played} of 18 posted. Gross is live; net stays sealed until the card is finished.`;
  } catch (err) {
    msg.className = 'msg err';
    msg.textContent = err.message;
  }
});
