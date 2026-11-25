// CongoFlow — Recherche, hashtags, Tendances
import { t, tx, state, save, ev, hypeScore, fmtDate, fmtTime, trendingHashtags, plural, IMG } from './core.js';
import { ILLU } from './feed.js';
import { renderLangPicker } from './pages.js';

export function renderSearch(root, nav) {
  const s = state();
  let q = '';
  const filters = { date: 'all', area: 'all', type: 'all', price: 'all' };

  root.innerHTML = `
  <div class="sr-page">
    <div class="search-bar big">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="srQ" placeholder="${t('nav.searchPlaceholder')}" autocomplete="off">
      <button class="icon-btn hidden" id="srClear" aria-label="${t('common.close')}">✕</button>
    </div>
    <div id="srBody"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const body = $('#srBody');

  function suggestions() {
    const pool = s.events.filter(e => e.status === 'ok');
    const words = [...new Set(pool.flatMap(e => [tx(e.title).split(' ')[0], e.area, e.commune, ...e.hashtags]))].slice(0, 40);
    return q ? words.filter(w => w.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  }

  function results() {
    let items = s.events.filter(e => e.status === 'ok' && new Date(e.date) > Date.now());
    const ql = q.toLowerCase();
    if (q) {
      items = items.filter(e =>
        tx(e.title).toLowerCase().includes(ql) || tx(e.desc).toLowerCase().includes(ql)
        || e.area.toLowerCase().includes(ql) || e.commune.toLowerCase().includes(ql)
        || (e.hashtags || []).some(h => h.includes(ql.replace('#', ''))));
    }
    if (filters.date !== 'all') {
      const lim = filters.date === 'week' ? 7 : 30;
      items = items.filter(e => (new Date(e.date) - Date.now()) / 864e5 <= lim);
    }
    if (filters.area !== 'all') items = items.filter(e => e.commune === filters.area || e.area === filters.area);
    if (filters.type !== 'all') items = items.filter(e => e.category === filters.type);
    if (filters.price === 'free') items = items.filter(e => !e.price?.on);
    if (filters.price === 'paid') items = items.filter(e => e.price?.on);
    items.sort((a, b) => hypeScore(b) - hypeScore(a));
    return items;
  }

  function render() {
    $('#srClear').classList.toggle('hidden', !q);
    // suggestions pendant la frappe
    const sug = suggestions();
    const hist = s.searchHistory.slice(0, 8);

    if (!q) {
      // page d'accueil de la recherche : historique + tendances
      body.innerHTML = `
        ${hist.length ? `
        <div class="flex jc-b ai-c mt-16 mb-8"><span class="t-small"><strong>${t('search.history')}</strong></span>
        <button class="link-btn" id="clearHist">${t('search.clearHistory')}</button></div>
        <div class="sr-hist">${hist.map(h => `<button class="tag-chip" data-q="${h}">${h}</button>`).join('')}</div>` : ''}
        <h2 class="t-h3 mt-24">🔥 ${t('search.trendingTitle')}</h2>
        <p class="t-small">${t('search.trendingSubtitle')}</p>
        <div class="trend-list">
          ${trendingHashtags(6).map((h, i) => {
            const count = s.events.filter(e => (e.hashtags || []).includes(h) && e.status === 'ok').length;
            return `<button class="trend-item card" data-tag="${h}">
              <span class="trend-rank">${i + 1}</span>
              <div><strong>#${h}</strong><br><span class="t-small">${plural('search.eventsCount', count)}</span></div>
              <span class="trend-meta badge-hype">🔥</span>
            </button>`; }).join('')}
        </div>`;
      body.querySelectorAll('[data-tag]').forEach(b => b.addEventListener('click', () => { location.hash = '#/tag/' + b.dataset.tag; }));
      body.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { q = b.dataset.q; $('#srQ').value = q; render(); }));
      $('#clearHist')?.addEventListener('click', () => { s.searchHistory = []; save(); render(); });
      return;
    }

    const res = results();
    body.innerHTML = `
      ${sug.length ? `<div class="sr-sugg">${sug.map(w => `<button data-w="${w}">🔍 ${w}<span class="sr-cat">${w.startsWith('#') ? 'hashtag' : ''}</span></button>`).join('')}</div>` : ''}
      <div class="filter-row mt-8">
        <select id="sf-date"><option value="all">${t('search.filterDate')} · ${t('search.filterAll')}</option><option value="week">${t('search.filterWeek')}</option><option value="month">${t('search.filterMonth')}</option></select>
        <select id="sf-area"><option value="all">${t('search.filterArea')} · ${t('search.filterAll')}</option>${[...new Set(s.events.map(e => e.commune))].map(a => `<option ${filters.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
        <select id="sf-type"><option value="all">${t('search.filterType')} · ${t('search.filterAll')}</option>${Object.entries(t('feed.categories')).map(([k, v]) => `<option value="${k}" ${filters.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select id="sf-price"><option value="all">${t('search.filterPrice')} · ${t('search.filterAny')}</option><option value="free">${t('search.filterFree')}</option><option value="paid">${t('search.filterPaid')}</option></select>
      </div>
      <p class="t-small mt-12">${plural('search.resultsCount', res.length)}</p>
      <div class="stack-list">
        ${res.length ? res.map(e => `
        <button class="mine-item card" data-open="${e.id}">
          <div class="mi-media"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="" loading="lazy"></div>
          <div class="mi-body">
            <div class="flex gap-8 ai-c wrap"><span class="badge-hype">🔥 ${hypeScore(e).toLocaleString()}</span>
            <span class="ev-price ${e.price?.on ? '' : 'free'}">${e.price?.on ? e.price.amount + ' ' + e.price.cur : t('common.free')}</span></div>
            <strong class="mi-title">${tx(e.title)}</strong>
            <span class="t-small">📅 ${fmtDate(e.date)} · ${fmtTime(e.date)} · 📍 ${e.area}, ${e.commune}</span>
          </div>
        </button>`).join('') : `
        <div class="state-box card">
          <div class="state-illu">${ILLU.noresults()}</div>
          <p class="t-body"><strong>${t('search.noResults')}</strong></p>
          <p class="t-small mt-8">${t('search.noResultsHint')}</p>
        </div>`}
      </div>`;

    body.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => { q = b.dataset.w; $('#srQ').value = q; pushHist(q); render(); }));
    body.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => import('./feed.js').then(m => m.openDetail(b.dataset.open, nav))));
    const sel = (id, key) => body.querySelector(id).addEventListener('change', e2 => { filters[key] = e2.target.value; render(); });
    sel('#sf-date', 'date'); sel('#sf-area', 'area'); sel('#sf-type', 'type'); sel('#sf-price', 'price');
  }

  function pushHist(term) {
    s.searchHistory = [term, ...s.searchHistory.filter(x => x !== term)].slice(0, 10);
    save();
  }

  let deb;
  $('#srQ').addEventListener('input', e => {
    clearTimeout(deb);
    deb = setTimeout(() => { q = e.target.value.trim(); render(); }, 160);
  });
  $('#srQ').addEventListener('keydown', e => { if (e.key === 'Enter' && q) pushHist(q); });
  $('#srClear').addEventListener('click', () => { q = ''; $('#srQ').value = ''; render(); $('#srQ').focus(); });

  render();
}

// ————— Page hashtag —————
export function renderTag(root, nav, tag) {
  const s = state();
  const items = s.events.filter(e => e.status === 'ok' && (e.hashtags || []).includes(tag));
  const sorted = items.slice().sort((a, b) => hypeScore(b) - hypeScore(a));

  root.innerHTML = `
  <div class="sr-page">
    <button class="link-btn" id="tagBack">← ${t('search.title')}</button>
    <div class="tag-hero card">
      <h1 class="t-h2">#${tag}</h1>
      <span class="t-small">${plural('search.hashtagEvents', items.length)} · 🔥 ${t('common.hype')}</span>
    </div>
    <h2 class="t-h3 mt-24">${t('search.hashtagEvents')}</h2>
    <div class="stack-list">
      ${sorted.length ? sorted.map(e => `
      <button class="mine-item card" data-open="${e.id}">
        <div class="mi-media"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="" loading="lazy"></div>
        <div class="mi-body">
          <span class="badge-hype">🔥 ${hypeScore(e).toLocaleString()}</span>
          <strong class="mi-title">${tx(e.title)}</strong>
          <span class="t-small">📅 ${fmtDate(e.date)} · 📍 ${e.area}, ${e.commune}</span>
        </div>
      </button>`).join('') : `<div class="state-box card"><div class="state-illu">${ILLU.noresults()}</div><p class="t-body">${t('search.noResults')}</p></div>`}
    </div>
  </div>`;

  root.querySelector('#tagBack').addEventListener('click', () => location.hash = '#/search');
  root.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => import('./feed.js').then(m => m.openDetail(b.dataset.open, nav))));
}
