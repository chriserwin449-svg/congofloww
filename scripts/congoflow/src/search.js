// CongoFlow — Recherche (onglets Événements/Comptes/Hashtags), hashtags façon TikTok
import { t, tx, state, save, ev, hypeScore, fmtDate, fmtTime, trendingHashtags, plural, IMG, icon, CITIES, userById, avatarHTML } from './core.js';
import { ILLU } from './feed.js';

export function renderSearch(root, nav) {
  const s = state();
  let q = '';
  let tab = 'events'; // events | accounts | hashtags
  const filters = { date: 'all', city: 'all', type: 'all', price: 'all' };

  root.innerHTML = `
  <div class="sr-page">
    <div class="search-bar big">
      ${icon('search', 17)}
      <input id="srQ" placeholder="${t('nav.searchPlaceholder')}" autocomplete="off">
      <button class="icon-btn hidden" id="srClear" aria-label="${t('common.close')}">${icon('close', 15)}</button>
    </div>
    <div class="tabs three" id="srTabs">
      <span class="tab-ink" id="srInk"></span>
      <button class="on" data-tab="events">${t('search.tabEvents')}</button>
      <button data-tab="accounts">${t('search.tabAccounts')}</button>
      <button data-tab="hashtags">${t('search.tabHashtags')}</button>
    </div>
    <div id="srBody"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const body = $('#srBody');

  function matchEvents() {
    let items = s.events.filter(e => e.status === 'ok' && new Date(e.date) > Date.now());
    const ql = q.toLowerCase().replace('#', '');
    if (q) {
      items = items.filter(e =>
        tx(e.title).toLowerCase().includes(ql) || tx(e.desc).toLowerCase().includes(ql)
        || e.city.toLowerCase().includes(ql) || e.area.toLowerCase().includes(ql) || e.commune.toLowerCase().includes(ql)
        || (e.hashtags || []).some(h => h.includes(ql)));
    }
    if (filters.date !== 'all') {
      const lim = filters.date === 'week' ? 7 : 30;
      items = items.filter(e => (new Date(e.date) - Date.now()) / 864e5 <= lim);
    }
    if (filters.city !== 'all') items = items.filter(e => e.city === filters.city);
    if (filters.type !== 'all') items = items.filter(e => e.category === filters.type);
    if (filters.price === 'free') items = items.filter(e => !e.price?.on);
    if (filters.price === 'paid') items = items.filter(e => e.price?.on);
    items.sort((a, b) => hypeScore(b) - hypeScore(a));
    return items;
  }

  function matchAccounts() {
    const pool = [...s.users, ...(s.user ? [s.user] : [])];
    if (!q) return pool.sort((a, b) => b.followers - a.followers);
    const ql = q.toLowerCase().replace('@', '');
    return pool.filter(u => u.name.toLowerCase().includes(ql) || u.username.toLowerCase().includes(ql) || (u.city || '').toLowerCase().includes(ql));
  }

  function matchHashtags() {
    const all = [...new Set(s.events.filter(e => e.status === 'ok').flatMap(e => e.hashtags || []))];
    if (!q) return trendingHashtags(12);
    const ql = q.toLowerCase().replace('#', '');
    return all.filter(h => h.includes(ql)).sort((a, b) => hypeOfTag(b) - hypeOfTag(a));
  }

  function hypeOfTag(tag) {
    return s.events.filter(e => (e.hashtags || []).includes(tag)).reduce((a, e) => a + hypeScore(e), 0);
  }

  function render() {
    $('#srClear').classList.toggle('hidden', !q);

    if (!q) {
      // page d'accueil de la recherche : historique + tendances (sans compteur)
      const hist = s.searchHistory.slice(0, 8);
      body.innerHTML = `
        ${hist.length ? `
        <div class="flex jc-b ai-c mt-16 mb-8"><span class="t-small"><strong>${t('search.history')}</strong></span>
        <button class="link-btn" id="clearHist">${t('search.clearHistory')}</button></div>
        <div class="sr-hist">${hist.map(h => `<button class="tag-chip" data-q="${h}">${h}</button>`).join('')}</div>` : ''}
        <h2 class="t-h3 mt-24">${icon('flame', 15)} ${t('search.trendingTitle')}</h2>
        <p class="t-small">${t('search.trendingSubtitle')}</p>
        <div class="trend-list">
          ${trendingHashtags(8).map((h, i) => `
          <button class="trend-item card" data-tag="${h}">
            <span class="trend-rank">${i + 1}</span>
            <div><strong>#${h}</strong></div>
            <span class="trend-meta badge-hype">${icon('flame', 12)}</span>
          </button>`).join('')}
        </div>`;
      body.querySelectorAll('[data-tag]').forEach(b => b.addEventListener('click', () => { location.hash = '#/tag/' + b.dataset.tag; }));
      body.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { q = b.dataset.q; $('#srQ').value = q; render(); }));
      $('#clearHist')?.addEventListener('click', () => { s.searchHistory = []; save(); render(); });
      return;
    }

    // Résultats selon l'onglet
    if (tab === 'events') {
      const res = matchEvents();
      body.innerHTML = `
      <div class="filter-row mt-8">
        <select id="sf-date"><option value="all">${t('search.filterDate')} · ${t('search.filterAll')}</option><option value="week">${t('search.filterWeek')}</option><option value="month">${t('search.filterMonth')}</option></select>
        <select id="sf-city"><option value="all">${t('search.filterCity')} · ${t('search.filterAll')}</option>${[...new Set(s.events.map(e => e.city))].map(a => `<option ${filters.city === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
        <select id="sf-type"><option value="all">${t('search.filterType')} · ${t('search.filterAll')}</option>${Object.entries(t('feed.categories')).filter(([k]) => k !== 'all').map(([k, v]) => `<option value="${k}" ${filters.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select id="sf-price"><option value="all">${t('search.filterPrice')} · ${t('search.filterAny')}</option><option value="free">${t('search.filterFree')}</option><option value="paid">${t('search.filterPaid')}</option></select>
      </div>
      <p class="t-small mt-12">${plural('search.resultsCount', res.length)}</p>
      <div class="stack-list">
        ${res.length ? res.map(e => `
        <button class="mine-item card" data-open="${e.id}">
          <div class="mi-media"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="" loading="lazy"></div>
          <div class="mi-body">
            <div class="flex gap-8 ai-c wrap"><span class="badge-hype">${icon('flame', 12)} ${hypeScore(e).toLocaleString()}</span>
            <span class="ev-price ${e.price?.on ? '' : 'free'}">${e.price?.on ? e.price.amount + ' ' + e.price.cur : t('common.free')}</span></div>
            <strong class="mi-title">${tx(e.title)}</strong>
            <span class="t-small mi-meta">${icon('calendar', 12)} ${fmtDate(e.date)} · ${fmtTime(e.date)}</span>
            <span class="t-small mi-meta">${icon('pin', 12)} ${e.area}, ${e.city}</span>
          </div>
        </button>`).join('') : `
        <div class="state-box card">
          <div class="state-illu">${ILLU.noresults()}</div>
          <p class="t-body"><strong>${t('search.noResults')}</strong></p>
          <p class="t-small mt-8">${t('search.noResultsHint')}</p>
        </div>`}
      </div>`;
      body.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => import('./feed.js').then(m => m.openDetail(b.dataset.open, nav))));
      const sel = (id, key) => body.querySelector(id).addEventListener('change', e2 => { filters[key] = e2.target.value; render(); });
      sel('#sf-date', 'date'); sel('#sf-city', 'city'); sel('#sf-type', 'type'); sel('#sf-price', 'price');
    }

    if (tab === 'accounts') {
      const res = matchAccounts();
      body.innerHTML = `
      <div class="stack-list">
        ${res.length ? res.map(u => `
        <div class="mine-item card">
          ${avatarHTML(u, 'big')}
          <div class="mi-body">
            <strong class="mi-title">${u.name} ${u.verified ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="${t('common.verified')}"><circle cx="12" cy="12" r="10" fill="var(--bordeaux)"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</strong>
            <span class="t-small">@${u.username} · ${u.city || ''}</span>
            <div class="mi-actions">
              <button class="btn btn-sm btn-ghost" data-profile="${u.id}">${t('common.see')}</button>
              ${!(s.follows || []).includes(u.id) && u.id !== s.user?.id ? `<button class="btn btn-sm btn-primary" data-follow="${u.id}">${t('common.follow')}</button>` : ''}
            </div>
          </div>
        </div>`).join('') : `<div class="state-box card"><div class="state-illu">${ILLU.noresults()}</div><p class="t-body">${t('search.noResults')}</p></div>`}
      </div>`;
      body.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { location.hash = '#/u/' + b.dataset.profile; }));
      body.querySelectorAll('[data-follow]').forEach(b => b.addEventListener('click', function () {
        s.follows = [...new Set([...(s.follows || []), this.dataset.follow])];
        const u = userById(this.dataset.follow); u.followers = (u.followers || 0) + 1;
        save(); this.textContent = '✓'; this.disabled = true;
      }));
    }

    if (tab === 'hashtags') {
      const res = matchHashtags();
      body.innerHTML = `
      <div class="stack-list">
        ${res.length ? res.map(h => `
        <button class="trend-item card" data-tag="${h}">
          <span class="so-ico" style="background:rgba(155,28,40,.1);color:var(--red)">${icon('tag', 17)}</span>
          <div><strong>#${h}</strong></div>
          <span class="trend-meta badge-hype">${icon('flame', 12)}</span>
        </button>`).join('') : `<div class="state-box card"><div class="state-illu">${ILLU.noresults()}</div><p class="t-body">${t('search.noResults')}</p></div>`}
      </div>`;
      body.querySelectorAll('[data-tag]').forEach(b => b.addEventListener('click', () => { location.hash = '#/tag/' + b.dataset.tag; }));
    }
  }

  function pushHist(term) {
    s.searchHistory = [term, ...s.searchHistory.filter(x => x !== term)].slice(0, 10);
    save();
  }

  root.querySelectorAll('#srTabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    root.querySelectorAll('#srTabs button').forEach(x => x.classList.toggle('on', x === b));
    const k = tab === 'events' ? 0 : tab === 'accounts' ? 1 : 2;
    $('#srInk').style.transform = `translateX(${k * 100}%)`;
    render();
  }));

  let deb;
  $('#srQ').addEventListener('input', e => {
    clearTimeout(deb);
    deb = setTimeout(() => { q = e.target.value.trim(); render(); }, 160);
  });
  $('#srQ').addEventListener('keydown', e => { if (e.key === 'Enter' && q) pushHist(q); });
  $('#srClear').addEventListener('click', () => { q = ''; $('#srQ').value = ''; render(); $('#srQ').focus(); });

  render();
}

// ————— Page hashtag (façon TikTok) —————
export function renderTag(root, nav, tag) {
  const s = state();
  const favTags = s.favTags = s.favTags || [];
  const isFav = favTags.includes(tag);

  // les premiers événements à avoir lancé la tendance remontent en tête des Populaires
  const items = s.events.filter(e => e.status === 'ok' && (e.hashtags || []).includes(tag));
  const popular = items.slice().sort((a, b) => hypeScore(b) - hypeScore(a))
    .sort((a, b) => (new Date(a.ts || a.date) - new Date(b.ts || b.date)) * 0 + 0); // hype d'abord
  const recent = items.slice().sort((a, b) => new Date(b.ts || b.date) - new Date(a.ts || a.date));
  let tab = 'popular';

  root.innerHTML = `
  <div class="sr-page">
    <button class="link-btn" id="tagBack">${icon('chevL', 15)} ${t('common.search')}</button>
    <div class="tag-hero card">
      <div class="th-row">
        <span class="th-ico">${icon('tag', 22)}</span>
        <h1 class="t-h2">#${tag}</h1>
        <button class="btn ${isFav ? 'btn-dark' : 'btn-ghost'} btn-sm" id="tagFav" aria-pressed="${isFav}">${icon('bookmark', 14)} ${isFav ? t('search.unfavorite') : t('search.favorite')}</button>
      </div>
    </div>
    <div class="tabs two" id="tagTabs">
      <span class="tab-ink"></span>
      <button class="on" data-tab="popular">${t('search.tabPopular')}</button>
      <button data-tab="recent">${t('search.tabRecent')}</button>
    </div>
    <div class="tag-grid" id="tagGrid"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);

  function renderGrid() {
    const list = tab === 'popular' ? popular : recent;
    $('#tagGrid').innerHTML = list.length ? list.map(e => `
      <button class="tg-item" data-open="${e.id}">
        <img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="${tx(e.title)}" loading="lazy" class="img-prog" onload="this.classList.add('loaded')">
        <div class="tg-shade"></div>
        <span class="badge-hype tg-hype">${icon('flame', 11)} ${hypeScore(e).toLocaleString()}</span>
        <div class="tg-cap"><strong>${tx(e.title)}</strong><span>${icon('pin', 10)} ${e.city}</span></div>
      </button>`).join('')
      : `<div class="state-box card" style="grid-column:1/-1"><div class="state-illu">${ILLU.noresults()}</div><p class="t-body">${t('search.noResults')}</p></div>`;
    root.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => import('./feed.js').then(m => m.openDetail(b.dataset.open, nav))));
  }

  $('#tagBack').addEventListener('click', () => location.hash = '#/app/search');
  $('#tagFav').addEventListener('click', function () {
    const on = !favTags.includes(tag);
    s.favTags = on ? [...favTags, tag] : favTags.filter(x => x !== tag);
    save();
    this.classList.toggle('btn-dark', on); this.classList.toggle('btn-ghost', !on);
    this.setAttribute('aria-pressed', on);
    this.innerHTML = `${icon('bookmark', 14)} ${on ? t('search.unfavorite') : t('search.favorite')}`;
    toast(on ? t('search.favorited') : t('search.unfavorite'), 'ok');
  });
  root.querySelectorAll('#tagTabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    root.querySelectorAll('#tagTabs button').forEach(x => x.classList.toggle('on', x === b));
    root.querySelector('#tagTabs .tab-ink').classList.toggle('right', tab !== 'popular');
    renderGrid();
  }));
  renderGrid();
}
