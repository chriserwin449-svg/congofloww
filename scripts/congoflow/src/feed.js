// CongoFlow — Fil à swiper (carte-affiche 4:5) + fiche détaillée
import { t, tx, state, save, ev, userById, avatarHTML, feedOrder, hypeScore, hypeLevel, todayBoosts, bumpStat, fmtDate, fmtTime, fmtPrice, plural, submitReport, uid, IMG, icon, dateBadge } from './core.js';

const imgFeed = (id, cls = '', alt = '') => `<img src="${IMG(id)}" class="${cls} img-prog" alt="${alt}" loading="lazy" decoding="async" onload="this.classList.add('loaded')">`;

// Mention de date dynamique sur la carte

// ———————————————————— Carte-affiche portrait 4:5 ————————————————————
export function posterCardHTML(e, opts = {}) {
  const s = state();
  const u = userById(e.organizer);
  const hs = hypeScore(e);
  const lvl = hypeLevel(hs);
  const cover = e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img);
  const cats = t('feed.categories');
  const catIcons = t('feed.catIcons');
  const liked = s.myLikes.includes(e.id);
  const saved = (s.mySaves || []).includes(e.id);
  const showCounts = e.showLikes !== false;
  const dt = new Date(e.date);
  return `
  <div class="ev-poster" data-ev="${e.id}">
    <div class="evp-img-wrap">
      <img src="${cover}" class="img-prog" alt="${tx(e.title)}" loading="eager" decoding="async" onload="this.classList.add('loaded')">
      <div class="evp-gradient"></div>
      <!-- Bloc de date billet -->
      <div class="evp-date" aria-hidden="true"><b>${dt.getDate()}</b><span>${dt.toLocaleDateString(s.lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'short' }).replace('.', '').toUpperCase()}</span></div>
      <!-- Badges haut droite -->
      <div class="evp-badges">
        <span class="evp-when">${dateBadge(e)}</span>
        <span class="evp-city">${icon('pin', 12)} ${e.city}</span>
      </div>
      <!-- Panneau verre dépoli : infos principales -->
      <div class="evp-panel">
        <div class="evp-chips">
          <span class="badge-hype" title="${t('hype.levels')[lvl]}">${icon('flame', 13)} ${hs.toLocaleString()}<i class="hype-gauge" style="--p:${Math.min(100, hs / 160)}%"></i></span>
          <span class="ev-price ${e.price?.on ? '' : 'free'}">${e.price?.on ? fmtPrice(e.price) : t('common.free')}</span>
          <span class="evp-cat">${icon(catIcons[e.category] || 'sparkle', 12)} ${cats[e.category] || e.category}</span>
        </div>
        <h3 class="evp-title">${tx(e.title)}</h3>
        ${e.sub ? `<p class="evp-sub">${tx(e.sub)}</p>` : ''}
        <div class="evp-org">
          ${avatarHTML(u)}
          <span>${u?.name || ''}</span>
          ${u?.verified ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="${t('common.verified')}"><circle cx="12" cy="12" r="10" fill="var(--bordeaux)"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </div>
      </div>
    </div>
    <!-- Rail d'actions supprimé de l'image (les actions restent dans la fiche détaillée) -->
  </div>`;
}

// ———————————————————— Fil à swiper ————————————————————
export function renderFeed(root, nav) {
  const s = state();
  const myCity = s.user.city || 'Kinshasa';
  let tab = 'foryou';       // foryou | mycity | hyped
  let category = 'all';
  let queue = [];
  let idx = 0;

  // Salutation : prénom seul + moment de la journée
  const first = (s.user?.name || '').split(' ')[0] || '';
  const h = new Date().getHours();
  const greetKey = h < 5 ? 'feed.greetNight' : h < 12 ? 'feed.greetMorning' : h < 18 ? 'feed.greetAfternoon' : 'feed.greetEvening';
  const greeting = t(greetKey, { name: first });

  const cats = t('feed.categories');
  const catIcons = t('feed.catIcons');

  root.innerHTML = `
  <div class="feed-page">
    <div class="feed-head">
      <p class="feed-greet t-small" id="feedGreet">${greeting}</p>
      <h1 class="feed-title">${t('feed.titleLead')} <span class="serif-accent">${myCity}</span></h1>
    </div>

    <div class="feed-cols">
      <!-- Colonne gauche (desktop) : filtres + tendances -->
      <aside class="fc-left" aria-label="${t('feed.filtersTitle')}">
        <div class="fc-card card">
          <div class="fc-city">
            ${icon('pin', 18)}
            <div><strong>${myCity}</strong><span class="t-small">${t('loc.yourCityHint')}</span></div>
          </div>
        </div>
        <div class="fc-card card">
          <h3 class="t-h3">${t('feed.filtersTitle')}</h3>
          <div class="fc-filters" id="fcFilters">
            ${Object.entries(cats).map(([k, v]) => `<button class="fc-filter ${k === 'all' ? 'on' : ''} cat-${k}" data-cat="${k}">${icon(catIcons[k] || 'sparkle', 15)} ${v}</button>`).join('')}
          </div>
        </div>
        <div class="fc-card card">
          <h3 class="t-h3">${icon('tag', 15)} ${t('feed.trendsIn', { city: myCity })}</h3>
          <div class="fc-trends" id="fcTrends"></div>
        </div>
      </aside>

      <!-- Colonne centrale : pile de cartes -->
      <div class="fc-center">
        <div class="tabs three" id="feedTabs" role="tablist">
          <span class="tab-ink" id="feedInk"></span>
          <button class="on" data-tab="foryou" role="tab">${t('feed.tabForYou')}</button>
          <button data-tab="mycity" role="tab">${t('feed.tabMyCity')}</button>
          <button data-tab="hyped" role="tab">${t('feed.tabHyped')}</button>
        </div>
        <div class="swipe-zone" id="swipeZone">
          <div class="ambient-glow" id="ambientGlow" aria-hidden="true"></div>
          <div class="card-stack" id="cardStack" aria-live="polite"></div>
        </div>
        <div class="feed-actions">
          <button class="fa fa-x" id="btnPass" aria-label="${t('feed.pass')}" title="${t('feed.pass')}">${icon('x', 24)}</button>
          <button class="fa fa-undo" id="btnUndo" aria-label="${t('feed.undo')}" title="${t('feed.undo')}">${icon('undo', 21)}</button>
          <button class="fa fa-flame" id="btnBoost" aria-label="${t('feed.boostHype')}" title="${t('feed.boostHype')}">${icon('flame', 25)}</button>
          <button class="fa fa-heart" id="btnLike" aria-label="${t('feed.like')}" title="${t('feed.like')}">${icon('heart', 27)}</button>
        </div>
        <p class="kbd-hint t-small">${t('feed.keyboardHint')}</p>
        <div class="feed-empty hidden" id="feedEmpty"></div>
      </div>
    </div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const stack = $('#cardStack');
  const empty = $('#feedEmpty');
  const glow = $('#ambientGlow');

  function refresh() { queue = feedOrder({ tab, category, city: myCity }); idx = 0; renderStack(); }

  // Onglets
  root.querySelectorAll('#feedTabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    root.querySelectorAll('#feedTabs button').forEach(x => x.classList.toggle('on', x === b));
    const k = tab === 'foryou' ? 0 : tab === 'mycity' ? 1 : 2;
    $('#feedInk').style.transform = `translateX(${k * 100}%)`;
    refresh();
  }));

  // Pastilles catégories (panneau filtres desktop)
  const bindCats = (scope) => {
    scope.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
      category = b.dataset.cat;
      root.querySelectorAll('[data-cat]').forEach(x => {
        x.classList.toggle('on', x.dataset.cat === category);
        x.setAttribute('aria-pressed', x.dataset.cat === category);
      });
      refresh();
    }));
  };
  bindCats($('#fcFilters'));

  // Colonne gauche : tendances SANS compteur
  function renderTrends() {
    const tags = (trendingHashtagsLocal(6, myCity));
    $('#fcTrends').innerHTML = tags.length
      ? tags.map(h => `<a href="#/tag/${h}" class="fc-trend">#${h}</a>`).join('')
      : `<p class="t-small">${t('search.noResultsHint')}</p>`;
  }

  function trendingHashtagsLocal(n, city) {
    const counts = {};
    s.events.filter(e => e.status !== 'removed' && (!city || e.city === city)).forEach(e => {
      const hh = hypeScore(e);
      e.hashtags.forEach(tag => { counts[tag] = (counts[tag] || 0) + hh; });
    });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
    return arr;
  }

  function renderStack() {
    if (idx >= queue.length) { showEmpty(); return; }
    // Précharger les 3 cartes suivantes : la pile montre les 2 derrière
    const next = queue.slice(idx, idx + 3);
    stack.innerHTML = next.map((e, i) => `
      <div class="sw-card ${i === 0 ? 'top' : ''}" data-i="${i}" style="--z:${3 - i}">
        ${i === 0 ? posterCardHTML(e) : `<div class="sw-preview"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="" loading="lazy"></div>`}
      </div>`).join('');
    bindSwipe(next[0]);
    bumpStat(next[0].id, 'views');
    updateGlow(next[0]);
  }

  // Lueur ambiante : version floue de l'affiche en cours, estompée sur les bords
  function updateGlow(e) {
    const cover = e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img);
    glow.style.backgroundImage = `url(${cover})`;
    glow.classList.add('has');
  }

  function showEmpty() {
    stack.innerHTML = '';
    $('#swipeZone').classList.add('hidden');
    root.querySelector('.feed-actions').classList.add('hidden');
    $('.kbd-hint').classList.add('hidden');
    glow.classList.remove('has');
    empty.classList.remove('hidden');
    empty.innerHTML = `
      <div class="state-illu">${ILLU.seenall()}</div>
      <h2 class="t-h3">${t('feed.seenAllTitle')}</h2>
      <p class="t-body">${t('feed.seenAllText')}</p>
      <div class="flex gap-12 jc-c mt-16 wrap">
        <button class="btn btn-primary" id="emptyWiden">${t('feed.seenAllWiden')}</button>
        <button class="btn btn-ghost" id="emptyTags">${t('feed.seenAllExplore')}</button>
      </div>`;
    $('#emptyWiden').addEventListener('click', () => {
      s.myPasses = []; save();
      empty.classList.add('hidden');
      $('#swipeZone').classList.remove('hidden');
      root.querySelector('.feed-actions').classList.remove('hidden');
      $('.kbd-hint')?.classList.remove('hidden');
      category = 'all'; tab = 'foryou';
      root.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x.dataset.cat === 'all'));
      root.querySelectorAll('#feedTabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === 'foryou'));
      $('#feedInk').style.transform = 'translateX(0)';
      refresh();
    });
    $('#emptyTags').addEventListener('click', () => location.hash = '#/app/search');
  }

  function boostEvent(e, btn) {
    const day = new Date().toISOString().slice(0, 10);
    if (todayBoosts().length >= 3) return toast(t('feed.boostLimitDay'), 'err');
    if (s.myBoosts.some(b => b.ev === e.id)) return toast(t('feed.boostLimitEvent'), 'err');
    s.myBoosts.push({ ev: e.id, day }); save();
    bumpStat(e.id, 'boosts');
    btn?.classList.add('boost-glow'); setTimeout(() => btn?.classList.remove('boost-glow'), 700);
    toast(t('feed.boosted'), 'ok');
  }

  // ————— Physique du swipe —————
  function bindSwipe(e) {
    const el = stack.querySelector('.sw-card.top');
    if (!el) return;
    const zone = $('#swipeZone');
    let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false, pid = null;
    const TH = Math.min(zone.offsetWidth * 0.3, 160);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setT = () => {
      const rot = Math.max(-12, Math.min(12, dx / 18));
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      // éclat de couleur sur les bords de l'écran
      zone.style.setProperty('--edgeL', Math.max(0, Math.min(1, -dx / TH)));
      zone.style.setProperty('--edgeR', Math.max(0, Math.min(1, dx / TH)));
      zone.classList.toggle('edge', dx !== 0);
    };
    const down = (x, y, id) => { dragging = true; sx = x; sy = y; pid = id; };
    const move = (x, y) => {
      if (!dragging) return;
      dx = x - sx; dy = y - sy; setT();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (dy < -70 && Math.abs(dx) < 60) return undo();     // haut : précédent
      if (dx > TH) return fly(1, e);
      if (dx < -TH) return fly(-1, e);
      // retour en ressort
      el.style.transition = 'transform 380ms cubic-bezier(.22,1,.36,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 400);
      zone.classList.remove('edge'); zone.style.setProperty('--edgeL', 0); zone.style.setProperty('--edgeR', 0);
    };

    el.addEventListener('pointerdown', ev0 => { if (ev0.pointerType === 'mouse' && ev0.button !== 0) return; down(ev0.clientX, ev0.clientY, ev0.pointerId); el.setPointerCapture?.(ev0.pointerId); });
    el.addEventListener('pointermove', ev0 => { if (ev0.pointerId === pid) move(ev0.clientX, ev0.clientY); });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    // Toucher la carte → fiche détaillée (si pas de drag réel)
    el.addEventListener('click', (ev0) => {
      if (ev0.target.closest('.evp-rail')) return;
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) openDetail(e.id, nav);
    });
  }

  function fly(dir, e) {
    const el = stack.querySelector('.sw-card.top');
    if (!el) return;
    if (navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(dir > 0 ? 18 : 10);
    el.style.transition = 'transform 420ms cubic-bezier(.22,1,.36,1), opacity 420ms';
    el.style.transform = `translate(${dir * 130}vw, ${-40 + Math.random() * 80}px) rotate(${dir * 24}deg)`;
    el.style.opacity = '0';
    if (dir > 0) like(e, false); else pass(e);
    $('#swipeZone').classList.remove('edge');
    $('#swipeZone').style.setProperty('--edgeL', 0); $('#swipeZone').style.setProperty('--edgeR', 0);
    setTimeout(() => { idx++; renderStack(); }, 300);
  }

  function like(e, viaBtn = true) {
    if (!s.myLikes.includes(e.id)) { s.myLikes.push(e.id); save(); }
    bumpStat(e.id, 'likes');
    if (viaBtn) { fly(1, e); return; }
    toast(t('feed.addedToMine') + ' ♥', 'ok');
  }
  function pass(e) {
    if (!s.myPasses.includes(e.id)) { s.myPasses.push(e.id); save(); }
  }
  function undo() {
    if (idx === 0) { toast(t('feed.undoNoMore')); return; }
    const prev = queue[idx - 1];
    s.myLikes = s.myLikes.filter(x => x !== prev.id);
    s.myPasses = s.myPasses.filter(x => x !== prev.id);
    save();
    idx--; renderStack();
  }

  $('#btnLike').addEventListener('click', () => { const e = queue[idx]; if (e) { const h = $('#btnLike'); h.classList.add('heart-pop'); setTimeout(() => h.classList.remove('heart-pop'), 500); like(e); } });
  $('#btnPass').addEventListener('click', () => { const e = queue[idx]; if (e) fly(-1, e); });
  $('#btnUndo').addEventListener('click', undo);
  $('#btnBoost').addEventListener('click', () => { const e = queue[idx]; if (e) boostEvent(e, $('#btnBoost')); });

  // Flèches clavier + Espace (desktop)
  const onKey = (ke) => {
    if (!root.isConnected) return removeEventListener('keydown', onKey);
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const e = queue[idx]; if (!e) return;
    if (ke.key === 'ArrowRight') { ke.preventDefault(); $('#btnLike').click(); }
    if (ke.key === 'ArrowLeft') { ke.preventDefault(); $('#btnPass').click(); }
    if (ke.key === 'ArrowUp') { ke.preventDefault(); undo(); }
    if (ke.key === ' ') { ke.preventDefault(); openDetail(e.id, nav); }
  };
  addEventListener('keydown', onKey);

  // Tutoriel : UNIQUEMENT à la première création de compte (enregistré sur le compte)
  if (!s.user.seenIntro && !s.seenIntro) showTutorial();

  function showTutorial() {
    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop show';
    backdrop.innerHTML = `
    <div class="sheet show" role="dialog" aria-modal="true" aria-label="${t('feed.tutTitle')}" style="max-width:430px">
      <div class="sheet-grip"></div>
      <h2 class="t-h3 center">${t('feed.tutTitle')}</h2>
      <div class="tut-step card-drop" id="tutStep">
        <div class="tut-ico">${t('feed.tutSteps')[0].icon}</div>
        <p class="t-body center">${t('feed.tutSteps')[0].text}</p>
      </div>
      <div class="flex gap-12 mt-16">
        <button class="btn btn-ghost" id="tutSkip" style="flex:0 0 auto">${t('feed.tutSkip')}</button>
        <button class="btn btn-primary" id="tutNext" style="flex:1">${t('feed.tutNext')}</button>
      </div>
    </div>`;
    document.body.appendChild(backdrop);
    let step = 0;
    const steps = t('feed.tutSteps');
    const stepEl = backdrop.querySelector('#tutStep');
    const nextB = backdrop.querySelector('#tutNext');
    const render = () => {
      stepEl.innerHTML = `<div class="tut-ico">${steps[step].icon}</div><p class="t-body center">${steps[step].text}</p>`;
      stepEl.classList.remove('card-drop'); void stepEl.offsetWidth; stepEl.classList.add('card-drop');
      nextB.textContent = step === steps.length - 1 ? t('feed.tutStart') : t('feed.tutNext');
    };
    nextB.addEventListener('click', () => { if (step < steps.length - 1) { step++; render(); } else close(); });
    backdrop.querySelector('#tutSkip').addEventListener('click', close);
    function close() {
      // enregistré sur le COMPTE (persiste entre navigateurs) + store local
      s.user.seenIntro = true; s.seenIntro = true; save();
      backdrop.remove();
    }
  }

  renderTrends();
  refresh();
  return () => removeEventListener('keydown', onKey);
}

// ———————————————————— Fiche détaillée — PAGE ENTIÈRE (#/ev/:id) ————————————————————
export function openDetail(id, nav) {
  location.hash = '#/ev/' + id;
}

export function renderEventPage(root, nav, id) {
  const s = state();
  const e = ev(id);
  if (!e || e.status === 'removed') {
    root.innerHTML = `
    <div class="notfound">
      <div class="state-illu card-drop">${ILLU.notfound()}</div>
      <h1 class="t-h2">${t('report.blockedTitle')}</h1>
      <p class="t-body">${t('report.blockedText')}</p>
      <button class="link-btn mt-16" id="appealBtn">${t('report.appeal')}</button>
    </div>`;
    root.querySelector('#appealBtn').addEventListener('click', () => appealForm(id));
    return;
  }
  const u = userById(e.organizer);
  const hs = hypeScore(e), lvl = hypeLevel(hs);
  const liked = s.myLikes.includes(e.id);
  const inAgenda = s.myReminders.includes(e.id);
  const comments = [...(e._demoComments || []), ...(s.myComments[id] || [])];
  const cats = t('feed.categories');

  root.innerHTML = `
  <div class="ev-page">
    <div class="evp-hero">
      <img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" class="img-prog" alt="${tx(e.title)}" loading="eager" decoding="async" onload="this.classList.add('loaded')">
      <button class="evp-back" id="evpBack" aria-label="${t('common.back')}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="evp-share" id="evpShareBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15V4M8 8l4-4 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </div>
    </div>

    <div class="evp-body">
      <div class="flex ai-c gap-8 wrap">
        <span class="badge-hype">${icon('flame', 14)} ${hs.toLocaleString()} · ${t('hype.levels')[lvl]}</span>
        ${e.price?.on ? `<span class="ev-price">${fmtPrice(e.price)}</span>` : `<span class="ev-price free">${t('common.free')}</span>`}
        <span class="evp-when">${dateBadge(e)}</span>
      </div>
      <h1 class="evp-title">${tx(e.title)}</h1>
      ${e.sub ? `<p class="ev-sub">${tx(e.sub)}</p>` : ''}

      <div class="org-row">
        <a href="#/u/${e.organizer}" style="display:flex;align-items:center;gap:12px;color:inherit">
          ${avatarHTML(u, 'big')}
          <div><strong>${u?.name}</strong>${u?.verified ? ` <span class="badge-verified">✓ ${t('common.verified')}</span>` : ''}<br><span class="t-small">${u?.followers?.toLocaleString()} ${t('profile.followers')}</span></div>
        </a>
      </div>

      <dl class="detail-info">
        <div><dt>${icon('calendar', 16)} ${t('detail.date')}</dt><dd>${fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(e.date)}</dd></div>
        <div><dt>${icon('pin', 16)} ${t('detail.place')}</dt><dd>${e.addr}<br>${e.area}, ${e.commune} · ${e.city}</dd>
          <div class="map-box" aria-hidden="true"><div class="map-pin">${icon('pin', 22)}</div></div>
          <a class="link-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(e.addr + ', ' + e.commune + ', ' + e.city)}">${t('detail.route')} ↗</a>
        </div>
        <div><dt>${icon('ticket', 16)} ${t('detail.price')}</dt><dd>${e.price?.on ? fmtPrice(e.price) : t('common.free')}</dd></div>
        <div><dt>${icon('tag', 16)} ${t('feed.filtersTitle')}</dt><dd>${cats[e.category] || e.category} · ${e.city}</dd></div>
      </dl>

      <h2 class="t-h3 mt-16">${t('detail.description')}</h2>
      <p class="t-body">${tx(e.desc)}</p>
      ${e.program ? `<h2 class="t-h3 mt-16">${t('detail.program')}</h2><p class="t-body">${tx(e.program).replace(/\n/g, '<br>')}</p>` : ''}
      ${e.practical ? `<h2 class="t-h3 mt-16">${t('detail.practical')}</h2><p class="t-body">${tx(e.practical)}</p>` : ''}

      <h2 class="t-h3 mt-16">${t('detail.hashtags')}</h2>
      <div class="ev-tags">${(e.hashtags || []).map(h => `<a href="#/tag/${h}" class="tag-chip">#${h}</a>`).join('')}</div>

      <h2 class="t-h3 mt-16">${t('detail.comments')} (${e.allowComments ? comments.length : '—'})</h2>
      ${e.allowComments ? `
        <div class="comments" id="comments">
          ${comments.length ? comments.map(c => `
            <div class="comment">
              ${avatarHTML(userById(c.user))}
              <div><strong>${c.user === 'me' ? (s.user?.name || 'Moi') : userById(c.user)?.name}</strong><br><span>${c.text}</span></div>
            </div>`).join('') : `<p class="t-small">0</p>`}
        </div>
        <div class="comment-form">
          <input type="text" id="cInput" placeholder="${t('detail.addComment')}" maxlength="280">
          <button class="btn btn-primary btn-sm" id="cSend">${t('detail.postComment')}</button>
        </div>` : `<p class="t-small">${icon('lock', 13)} ${t('detail.commentsOff')}</p>`}

      ${e.showLikes ? `<p class="t-small mt-16">${icon('heart', 13)} ${(e.stats?.likes || 0).toLocaleString()} ${t('detail.likesCount')}</p>` : `<p class="t-small mt-16">${icon('lock', 13)} ${t('detail.countsHidden')}</p>`}
    </div>

    <div class="evp-actions">
      <button class="btn ${liked ? 'btn-dark' : 'btn-primary'}" id="dLike">${liked ? '♥ ' + t('detail.likedEvent') : '♡ ' + t('detail.likeEvent')}</button>
      <button class="btn btn-ghost" id="dAgenda">${inAgenda ? t('mine.reminderOn') : t('detail.addToAgenda')}</button>
      ${e.allowMessages && e.organizer !== s.user.id ? `<button class="btn btn-ghost" id="dMsg">${t('detail.message')}</button>` : ''}
      <button class="btn btn-ghost danger" id="dReport">${t('detail.report')}</button>
    </div>
  </div>`;

  root.querySelector('#evpBack').addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/app/feed'));
  root.querySelector('#evpShareBtn').addEventListener('click', () => shareSheet(e));
  root.querySelector('#dLike').addEventListener('click', function () {
    if (s.myLikes.includes(e.id)) { s.myLikes = s.myLikes.filter(x => x !== e.id); bumpStat(e.id, 'likes', -1); this.textContent = '♡ ' + t('detail.likeEvent'); this.classList.replace('btn-dark', 'btn-primary'); toast(t('mine.removed')); }
    else { s.myLikes.push(e.id); bumpStat(e.id, 'likes'); this.innerHTML = '♥ ' + t('detail.likedEvent'); this.classList.replace('btn-primary', 'btn-dark'); this.classList.add('heart-pop'); toast(t('feed.addedToMine') + ' ♥', 'ok'); }
    save();
  });
  root.querySelector('#dAgenda').addEventListener('click', function () {
    if (s.myReminders.includes(e.id)) { s.myReminders = s.myReminders.filter(x => x !== e.id); this.textContent = t('detail.addToAgenda'); toast(t('mine.reminderOffToast')); }
    else { s.myReminders.push(e.id); this.textContent = t('mine.reminderOn'); toast(t('mine.reminderToast'), 'ok'); }
    save();
  });
  root.querySelector('#dMsg')?.addEventListener('click', () => {
    let conv = s.convs.find(c => c.user === e.organizer);
    if (!conv) { conv = { id: uid('c'), user: e.organizer, messages: [] }; s.convs.unshift(conv); save(); }
    nav('activity', 'messages');
  });
  root.querySelector('#dReport').addEventListener('click', () => reportSheet('event', e.id));
  root.querySelector('#cSend')?.addEventListener('click', () => {
    const inp = root.querySelector('#cInput');
    const v = (inp.value || '').trim();
    if (!v) return;
    (s.myComments[id] = s.myComments[id] || []).push({ id: uid('cm'), user: s.user.id, text: v, ts: Date.now() });
    if (e.allowComments) bumpStat(e.id, 'comments');
    save();
    root.querySelector('#comments').insertAdjacentHTML('beforeend', `
      <div class="comment">${avatarHTML(s.user)}<div><strong>${s.user?.name}</strong><br><span>${v.replace(/</g, '&lt;')}</span></div></div>`);
    inp.value = '';
    toast(t('detail.commentPosted'), 'ok');
  });
}

// ————— Partage (dont WhatsApp) —————
export function shareSheet(e) {
  const url = location.origin + location.pathname + '#/ev/' + e.id;
  const text = t('detail.shareText') + ' ' + tx(e.title) + ' 🎉 ' + url;
  const c = sheet(`
    <h2 class="t-h3 center">${t('detail.share')}</h2>
    <div class="share-grid mt-16">
      <a class="share-opt" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">
        <span class="so-ico" style="background:#2E7D5B">✆</span>WhatsApp</a>
      <a class="share-opt" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}">
        <span class="so-ico" style="background:#0E0E10">𝕏</span>X</a>
      <button class="share-opt" id="copyLink"><span class="so-ico" style="background:#9B1C28">🔗</span>${t('detail.shareCopy')}</button>
    </div>`);
  bumpStat(e.id, 'shares');
  [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#copyLink').addEventListener('click', function () {
    navigator.clipboard?.writeText(url).catch(() => {});
    this.innerHTML = `<span class="so-ico" style="background:#2E7D5B"><svg class="check-draw play" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5.5 5.5L20 6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${t('common.copied')}`;
    setTimeout(() => c(), 1100);
  });
}

// ————— Signalement (événement / compte / message) —————
export function reportSheet(targetType, targetId) {
  const reasons = t('report.reasons');
  const titles = { event: 'report.titleEvent', account: 'report.titleAccount', message: 'report.titleMessage' };
  let chosen = null;
  const c = sheet(`
    <h2 class="t-h3">${t(titles[targetType] || 'report.title')}</h2>
    <div class="rep-list mt-16">
      ${Object.entries(reasons).map(([k, v]) => `
      <button class="rep-opt" data-r="${k}">
        <span>${v}</span>
        <span class="rep-radio"></span>
      </button>`).join('')}
    </div>
    <div class="field mt-16 hidden" id="otherField">
      <textarea id="repNote" placeholder="${t('report.otherPlaceholder')}" maxlength="300"></textarea>
    </div>
    <button class="btn btn-primary btn-block btn-lg mt-16" id="repSend" disabled>${t('report.submit')}</button>`);
  const scope = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
  scope().querySelectorAll('.rep-opt').forEach(b => b.addEventListener('click', () => {
    scope().querySelectorAll('.rep-opt').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel'); chosen = b.dataset.r;
    scope().querySelector('#otherField').classList.toggle('hidden', chosen !== 'other');
    scope().querySelector('#repSend').disabled = false;
  }));
  scope().querySelector('#repSend').addEventListener('click', () => {
    const note = scope().querySelector('#repNote')?.value || '';
    const res = submitReport(targetType, targetId, chosen, note);
    if (!res.ok) { toast(res.code === 'dup' ? t('report.alreadyReported') : t('report.limit'), 'err'); c(); return; }
    c();
    toast(t('report.thanks'), 'ok');
    setTimeout(() => toast(t('report.thanksHint')), 1800);
  });
  return c;
}

// ————— Formulaire de recours —————
export function appealForm(evId) {
  const c = sheet(`
    <h2 class="t-h3">${t('report.appealTitle')}</h2>
    <p class="t-body mt-8">${t('report.appealIntro')}</p>
    <div class="field mt-16"><textarea id="apText" placeholder="${t('report.appealPlaceholder')}" maxlength="500"></textarea></div>
    <button class="btn btn-primary btn-block btn-lg mt-16" id="apSend">${t('report.appealSend')}</button>`);
  const scope = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
  scope().querySelector('#apSend').addEventListener('click', () => {
    const v = (scope().querySelector('#apText').value || '').trim();
    if (!v) { scope().querySelector('#apText').closest('.field').classList.add('cf-shake'); return; }
    const ticket = submitAppeal(evId, v);
    c();
    sheet(`
      <h2 class="t-h3 center">✓</h2>
      <p class="t-body center mt-8">${t('report.appealSent', { ticket })}</p>
      <p class="t-small center mt-8">${t('report.appealStatus', { status: t('report.appealOpen') })}</p>`);
  });
}

// ————— Sheet utilitaire —————
export function sheet(html, opts = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `<div class="sheet ${opts.wide ? 'sheet-wide' : ''}" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => { backdrop.classList.add('show'); backdrop.querySelector('.sheet').classList.add('show'); });
  const close = () => {
    backdrop.classList.remove('show');
    backdrop.querySelector('.sheet').classList.remove('show');
    setTimeout(() => backdrop.remove(), 450);
  };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); removeEventListener('keydown', esc); } });
  return close;
}

// ————— Illustrations d'états (SVG traits épais) —————
export const ILLU = {
  seenall: () => `<svg viewBox="0 0 160 120" width="150" height="112" aria-hidden="true"><g fill="none" stroke="#0E0E10" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><rect x="35" y="18" width="90" height="86" rx="14"/><path d="M35 34h90" stroke="#9B1C28"/><path d="M48 52h40M48 66h26" /><circle cx="118" cy="92" r="4" fill="#9B1C28" stroke="none"/></g><g fill="#9B1C28"><rect x="12" y="24" width="7" height="7" rx="2" transform="rotate(20 12 24)"/><rect x="140" y="60" width="7" height="7" rx="2" transform="rotate(-15 140 60)"/><rect x="20" y="90" width="6" height="6" rx="2"/><rect x="132" y="22" width="6" height="6" rx="2"/></g></svg>`,
  noresults: () => `<svg viewBox="0 0 160 120" width="150" height="112" aria-hidden="true"><g fill="none" stroke="#0E0E10" stroke-width="4.5" stroke-linecap="round"><circle cx="66" cy="52" r="26"/><path d="M86 72l24 24" stroke="#9B1C28"/></g><g fill="#DAD5CC">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${118 + (i % 3) * 16}" cy="${26 + Math.floor(i / 3) * 16}" r="2.4"/>`).join('')}</g></svg>`,
  offline: () => `<svg viewBox="0 0 160 120" width="150" height="112" aria-hidden="true"><g fill="none" stroke="#0E0E10" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M52 62a38 38 0 0 1 56 0"/><path d="M38 46a58 58 0 0 1 84 0"/><circle cx="80" cy="82" r="6" fill="#9B1C28"/></g><path d="M34 96l92-72" stroke="#9B1C28" stroke-width="5" stroke-linecap="round"/></svg>`,
  notfound: () => `<svg viewBox="0 0 160 120" width="150" height="112" aria-hidden="true"><g fill="none" stroke="#0E0E10" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><rect x="45" y="26" width="70" height="66" rx="12" transform="rotate(8 80 60)"/><path d="M52 42l58 8" stroke="#9B1C28"/><path d="M56 60h34M58 72h24"/></g></svg>`,
};
