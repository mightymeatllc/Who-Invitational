/*
 * One duel row, shared by the Scoreboard and the Duel Card so the two pages can
 * never disagree about who is winning. All the reasoning lives in the Worker;
 * this only draws what it is told.
 */

export function duelRow(d, esc) {
  const tie = d.settled && d.winner === 'tie';

  /* Final: winner bold in team colour, loser struck through. Live: the man in
     front is coloured but nothing is struck through, because nothing is over. */
  const cls = (side) => {
    if (d.settled) {
      if (tie) return '';
      const won = side === (d.winner === 'ryobi' ? 'r' : 'b');
      return won ? ' won' : ' lost';
    }
    if (!d.leader || d.leader === 'tie') return '';
    return side === (d.leader === 'ryobi' ? 'r' : 'b') ? ' leads' : '';
  };

  const strokeNote = d.strokes === 0 ? 'Scratch' : `${d.strokes} to ${esc(d.givenTo)}`;

  let mid;
  if (d.settled) {
    mid = tie ? `<span class="tie">TIE</span>` : `Duel ${d.id}<br>${strokeNote}`;
  } else if (d.through === 0) {
    mid = `Duel ${d.id}<br>${strokeNote}`;
  } else if (d.leader === 'tie') {
    mid = `<span class="live-mid">All square</span><br>thru ${d.through}`;
  } else {
    const name = d.leader === 'ryobi' ? d.ryobi : d.blackdecker;
    mid = `<span class="live-mid">${esc(name)} by ${d.margin}</span><br>thru ${d.through}`;
  }

  const netv = (side) => {
    if (d.settled) return `net ${side === 'r' ? d.ryobiNet : d.bdNet}`;
    if (d.through === 0) return `plays ${side === 'r' ? d.ryobiHdcp : d.bdHdcp}`;
    const n = side === 'r' ? d.liveRyobiNet : d.liveBdNet;
    const t = side === 'r' ? d.ryobiThrough : d.bdThrough;
    return `net ${n} thru ${d.through}${t > d.through ? ` (${t} posted)` : ''}`;
  };

  return `<div class="duelrow${d.settled ? '' : ' is-live'}">
      <div class="side r${cls('r')}">
        <div class="who">${esc(d.ryobi)}</div>
        <div class="netv">${netv('r')}</div>
      </div>
      <div class="mid">${mid}</div>
      <div class="side b${cls('b')}">
        <div class="who">${esc(d.blackdecker)}</div>
        <div class="netv">${netv('b')}</div>
      </div>
    </div>`;
}
