/* Shared chrome: masthead detail line, nav current-state, footer, logo preload. */
import { loadRoster } from './data.js';

const PAGES = [
  { href: '/',             id: 'event',      label: 'Event' },
  { href: '/teams.html',   id: 'teams',      label: 'Teams' },
  { href: '/duels.html',   id: 'duels',      label: 'The Duel Card' },
  { href: '/scoreboard.html', id: 'scoreboard', label: 'Scoreboard' }
];

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Both badges are preloaded so the Winners' Circle reveal does not pop. */
export function preloadLogos(roster) {
  for (const t of roster.teams) {
    for (const src of [t.logo, t.logoTransparent]) {
      const l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'image';
      l.href = src;
      document.head.appendChild(l);
    }
  }
}

export function badge(team, variant = 'default', cls = '') {
  const src = variant === 'transparent' ? team.logoTransparent : team.logo;
  return `<div class="badge ${cls}"><img src="${esc(src)}" alt="${esc(team.name)} team badge" loading="eager" decoding="async"></div>`;
}

export async function chrome() {
  const roster = await loadRoster();
  const e = roster.event;
  const here = document.body.dataset.page;

  const line = document.querySelector('[data-eventline]');
  if (line) {
    line.innerHTML =
      `<b>${esc(e.dateLabel)}</b><span class="sep">·</span>${esc(e.course)}` +
      `<span class="sep">·</span>${esc(e.location)}<span class="sep">·</span>${esc(e.teeTimes)}` +
      `<span class="sep">·</span>${esc(e.afterparty)}`;
  }

  const nav = document.querySelector('[data-nav]');
  if (nav) {
    nav.innerHTML = PAGES.map(
      (p) => `<a href="${p.href}"${p.id === here ? ' aria-current="page"' : ''}>${esc(p.label)}</a>`
    ).join('');
  }

  const foot = document.querySelector('[data-foot]');
  if (foot) {
    foot.innerHTML =
      `<span>${esc(e.name)} — ${esc(e.dateLabel)}</span>` +
      `<span>Presented by ${esc(e.presentedBy)}</span>` +
      `<span>The committee settles nothing</span>`;
  }

  preloadLogos(roster);
  return roster;
}
