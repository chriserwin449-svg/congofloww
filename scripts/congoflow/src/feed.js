// CongoFlow — Fil à swiper + fiche détaillée
import { t, tx, state, save, ev, userById, avatarHTML, feedOrder, hypeScore, hypeLevel, todayBoosts, bumpStat, fmtDate, fmtTime, fmtPrice, plural, submitReport, uid, IMG } from './core.js';

const imgFeed = (id, cls = '', alt = '') => `<img src="${IMG(id)}" class="${cls} img-prog" alt="${alt}" loading="lazy" decoding="async" onload="this.classList.add('loaded')">`;

// ———————————————————— Carte d'événement ————————————————————
export function eventCardHTML(e, opts = {}) {
  const u = userById(e.organizer);
  const hs = hypeScore(e);
  const lvl = hypeLevel(hs);
  const cover = e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img);
  return `
  <div class="ev-card" data-ev="${e.id}">
    <div class="ev-media"><img src="${cover}" class="img-prog" alt="${tx(e.title)}" loading="lazy" decoding="async" onload="this.classList.add('loaded')"></div>
    <div class="ev-body">
      <div class="ev-top">
        <span class="badge-hype" title="${t('hype.levels')[lvl]}">🔥 ${hs.toLocaleString()}</span>
        ${e.price?.on ? `<span class="ev-price">${fmtPrice(e.price)}</span>` : `<span class="ev-price free">${t('common.free')}</span>`}
      </div>
      <h3 class="ev-title">${tx(e.title)}</h3>
      ${e.sub ? `<p class="ev-sub">${tx(e.sub)}</p>` : ''}
      <div class="ev-meta">
        <span class="ev-org">
          ${avatarHTML(u)}
          <span>${u?.name || ''}</span>${u?.verified ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="${t('common.verified')}"><circle cx="12" cy="12" r="10" fill="#2E7D5B"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </span>
        <span class="ev-when">📅 ${fmtDate(e.date)} · ${fmtTime(e.date)}</span>
        <span class="ev-where">📍 ${e.area}, ${e.commune}</span>
      </div>
      <div class="ev-tags">${(e.hashtags || []).slice(0, 4).map(h => `<a href="#/tag/${h}" class="tag-chip">#${h}</a>`).join('')}</div>
    </div>
  </div>`;
}

// ———————————————————— Fil à swiper ————————————————————
export function renderFeed(root, nav) {
  const s = state();
  let queue = feedOrder();
  let idx = 0;

  // Salutation personnalisée : prénom seul + moment de la journée
  const first = (s.user?.name || '').split(' ')[0] || '';
  const h = new Date().getHours();
  const greetKey = h < 5 ? 'feed.greetNight' : h < 12 ? 'feed.greetMorning' : h < 18 ? 'feed.greetAfternoon' : 'feed.greetEvening';
  const greeting = t(greetKey, { name: first });

  root.innerHTML = `
  <div class="feed-page">
    <div class="feed-head">
      <p class="feed-greet t-small" id="feedGreet">${greeting}</p>
      <h1 class="feed-title">${t('feed.titleLead')} <span class="serif-accent">${t('feed.titleAccent')}</span></h1>
      <button class="search-bar feed-search" id="feedSearchBtn" aria-label="${t('common.search')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2.2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        <span>${t('nav.searchPlaceholder')}</span>
      </button>
    </div>
    <div class="swipe-zone" id="swipeZone">
      <div class="card-stack" id="cardStack" aria-live="polite"></div>
      <div class="stamps"><span class="stamp like" id="stampLike">${t('feed.likeShort')}</span><span class="stamp pass" id="stampPass">${t('feed.passShort')}</span></div>
    </div>
    <div class="feed-actions">
      <button class="fa fa-undo" id="btnUndo" aria-label="${t('feed.undo')}" title="${t('feed.undo')}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h9a7 7 0 1 1 0 14h-1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
      <button class="fa fa-heart" id="btnLike" aria-label="${t('feed.like')}" title="${t('feed.like')}">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 20.5S3.5 15.5 3.5 9.3A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.5 2.9c0 6.2-8.5 11.2-8.5 11.2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      </button>
      <button class="fa fa-flame" id="btnBoost" aria-label="${t('feed.boostHype')}" title="${t('feed.boostHype')}">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2.5c1 3-1.2 4.6-2.6 6C8 9.9 7 11.4 7 13.3A5.4 5.4 0 0 0 12.4 19a5.5 5.5 0 0 0 5.6-5.5c0-2.6-1.4-3.9-2.4-5.4-.4 1-1 1.6-1.9 2 .5-2.8-.3-6.1-1.7-8.6z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>
      </button>
      <button class="fa fa-x" id="btnPass" aria-label="${t('feed.pass')}" title="${t('feed.pass')}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      </button>
    </div>
    <p class="kbd-hint t-small">${t('feed.keyboardHint')}</p>
    <div class="feed-empty hidden" id="feedEmpty"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const stack = $('#cardStack');
  const empty = $('#feedEmpty');

  // La barre de recherche de l'accueil mène directement à la page recherche
  $('#feedSearchBtn').addEventListener('click', () => { location.hash = '#/app/search'; });

  function renderStack() {
    if (idx >= queue.length) { showEmpty(); return; }
    // Précharger les 3 cartes suivantes
    const next = queue.slice(idx, idx + 4);
    stack.innerHTML = next.map((e, i) => `
      <div class="sw-card ${i === 0 ? 'top' : ''}" data-i="${i}" style="--z:${4 - i}">
        ${eventCardHTML(e)}
      </div>`).join('');
    bindSwipe(next[0]);
    bumpStat(next[0].id, 'views');
  }

  function showEmpty() {
    stack.innerHTML = '';
    $('#swipeZone').classList.add('hidden');
    root.querySelector('.feed-actions').classList.add('hidden');
    $('.kbd-hint').classList.add('hidden');
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
      queue = feedOrder(); idx = 0;
      $('#feedEmpty').classList.add('hidden');
      $('#swipeZone').classList.remove('hidden');
      root.querySelector('.feed-actions').classList.remove('hidden');
      $('.kbd-hint')?.classList.remove('hidden');
      renderStack();
    });
    $('#emptyTags').addEventListener('click', () => location.hash = '#/search');
  }

  // ————— Physique du swipe —————
  function bindSwipe(e) {
    const el = stack.querySelector('.sw-card.top');
    if (!el) return;
    const zone = $('#swipeZone');
    let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false, pid = null;
    const TH = zone.offsetWidth * 0.3;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setT = () => {
      const rot = Math.max(-12, Math.min(12, dx / 18));
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      $('#stampLike').style.opacity = Math.max(0, Math.min(1, dx / TH));
      $('#stampPass').style.opacity = Math.max(0, Math.min(1, -dx / TH));
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
      $('#stampLike').style.opacity = 0; $('#stampPass').style.opacity = 0;
    };

    el.addEventListener('pointerdown', ev0 => { if (ev0.pointerType === 'mouse' && ev0.button !== 0) return; down(ev0.clientX, ev0.clientY, ev0.pointerId); el.setPointerCapture?.(ev0.pointerId); });
    el.addEventListener('pointermove', ev0 => { if (ev0.pointerId === pid) move(ev0.clientX, ev0.clientY); });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    // Toucher la carte → fiche détaillée (si pas de drag réel)
    el.addEventListener('click', () => { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) openDetail(e.id, nav); });
  }

  function fly(dir, e) {
    const el = stack.querySelector('.sw-card.top');
    if (!el) return;
    if (navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(dir > 0 ? 18 : 10);
    el.style.transition = 'transform 420ms cubic-bezier(.22,1,.36,1), opacity 420ms';
    el.style.transform = `translate(${dir * 130}vw, ${-40 + Math.random() * 80}px) rotate(${dir * 24}deg)`;
    el.style.opacity = '0';
    if (dir > 0) like(e, false); else pass(e);
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
    // retour à l'événement précédent : annule l'action
    const prev = queue[idx - 1];
    s.myLikes = s.myLikes.filter(x => x !== prev.id);
    s.myPasses = s.myPasses.filter(x => x !== prev.id);
    save();
    idx--; renderStack();
  }

  $('#btnLike').addEventListener('click', () => { const e = queue[idx]; if (e) { const h = $('#btnLike svg'); h.classList.add('heart-pop'); setTimeout(() => h.classList.remove('heart-pop'), 500); like(e); } });
  $('#btnPass').addEventListener('click', () => { const e = queue[idx]; if (e) fly(-1, e); });
  $('#btnUndo').addEventListener('click', undo);
  $('#btnBoost').addEventListener('click', () => {
    const e = queue[idx]; if (!e) return;
    const day = new Date().toISOString().slice(0, 10);
    if (todayBoosts().length >= 3) return toast(t('feed.boostLimitDay'), 'err');
    if (s.myBoosts.some(b => b.ev === e.id)) return toast(t('feed.boostLimitEvent'), 'err');
    s.myBoosts.push({ ev: e.id, day }); save();
    bumpStat(e.id, 'boosts');
    const b = $('#btnBoost'); b.classList.add('boost-glow'); setTimeout(() => b.classList.remove('boost-glow'), 700);
    toast(t('feed.boosted'), 'ok');
  });

  // Flèches clavier (desktop)
  const onKey = (ke) => {
    if (!root.isConnected) return removeEventListener('keydown', onKey);
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const e = queue[idx]; if (!e) return;
    if (ke.key === 'ArrowRight') { ke.preventDefault(); $('#btnLike').click(); }
    if (ke.key === 'ArrowLeft') { ke.preventDefault(); $('#btnPass').click(); }
    if (ke.key === 'ArrowUp') { ke.preventDefault(); undo(); }
  };
  addEventListener('keydown', onKey);

  // Tutoriel au premier usage
  if (!s.seenIntro) showTutorial();

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
    function close() { s.seenIntro = true; save(); backdrop.remove(); }
  }

  renderStack();
  return () => removeEventListener('keydown', onKey);
}

// ———————————————————— Fiche détaillée — PAGE ENTIÈRE (#/ev/:id) ————————————————————
export function openDetail(id, nav) {
  // navigation par URL : page entière dédiée
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
  bumpStat(e.id, 'views', 0); // sans incrément inutile à chaque re-render

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
        <span class="badge-hype">🔥 ${hs.toLocaleString()} · ${t('hype.levels')[lvl]}</span>
        ${e.price?.on ? `<span class="ev-price">${fmtPrice(e.price)}</span>` : `<span class="ev-price free">${t('common.free')}</span>`}
      </div>
      <h1 class="evp-title">${tx(e.title)}</h1>
      ${e.sub ? `<p class="ev-sub">${tx(e.sub)}</p>` : ''}

      <div class="org-row">
        ${avatarHTML(u, 'big')}
        <div><strong>${u?.name}</strong>${u?.verified ? ` <span class="badge-verified">✓ ${t('common.verified')}</span>` : ''}<br><span class="t-small">${u?.followers?.toLocaleString()} ${t('profile.followers')}</span></div>
      </div>

      <dl class="detail-info">
        <div><dt>📅 ${t('detail.date')}</dt><dd>${fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(e.date)}</dd></div>
        <div><dt>📍 ${t('detail.place')}</dt><dd>${e.addr}<br>${e.area}, ${e.commune} · Kinshasa</dd>
          <div class="map-box" aria-hidden="true"><div class="map-pin">📍</div></div>
          <a class="link-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(e.addr + ', ' + e.commune + ', Kinshasa')}">${t('detail.route')} ↗</a>
        </div>
        <div><dt>🎟️ ${t('detail.price')}</dt><dd>${e.price?.on ? fmtPrice(e.price) : t('common.free')}</dd></div>
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
            </div>`).join('') : `<p class="t-small">${t('detail.comments')} — 0</p>`}
        </div>
        <div class="comment-form">
          <input type="text" id="cInput" placeholder="${t('detail.addComment')}" maxlength="280">
          <button class="btn btn-primary btn-sm" id="cSend">${t('detail.postComment')}</button>
        </div>` : `<p class="t-small">🔒 ${t('detail.commentsOff')}</p>`}

      ${e.showLikes ? `<p class="t-small mt-16">♥ ${(e.stats?.likes || 0).toLocaleString()} ${t('detail.likesCount')}</p>` : `<p class="t-small mt-16">🔒 ${t('detail.likesHidden')}</p>`}
    </div>

    <div class="evp-actions">
      <button class="btn ${liked ? 'btn-dark' : 'btn-primary'}" id="dLike">${liked ? '♥ ' + t('detail.likedEvent') : '♡ ' + t('detail.likeEvent')}</button>
      <button class="btn btn-ghost" id="dAgenda">${inAgenda ? '🔔 ' + t('mine.reminderOn') : '📅 ' + t('detail.addToAgenda')}</button>
      ${e.allowMessages && e.organizer !== 'me' ? `<button class="btn btn-ghost" id="dMsg">✉️ ${t('detail.message')}</button>` : ''}
      <button class="btn btn-ghost danger" id="dReport">⚠️ ${t('detail.report')}</button>
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
    if (s.myReminders.includes(e.id)) { s.myReminders = s.myReminders.filter(x => x !== e.id); this.textContent = '📅 ' + t('detail.addToAgenda'); toast(t('mine.reminderOffToast')); }
    else { s.myReminders.push(e.id); this.textContent = '🔔 ' + t('mine.reminderOn'); toast(t('mine.reminderToast'), 'ok'); }
    save();
  });
  root.querySelector('#dMsg')?.addEventListener('click', () => {
    // conversation avec l'organisateur
    let conv = s.convs.find(c => c.user === e.organizer);
    if (!conv) { conv = { id: uid('c'), user: e.organizer, messages: [] }; s.convs.unshift(conv); save(); }
    nav('activity', 'messages');
  });
  root.querySelector('#dReport').addEventListener('click', () => reportSheet('event', e.id));
  root.querySelector('#cSend')?.addEventListener('click', () => {
    const inp = root.querySelector('#cInput');
    const v = (inp.value || '').trim();
    if (!v) return;
    (s.myComments[id] = s.myComments[id] || []).push({ id: uid('cm'), user: 'me', text: v, ts: Date.now() });
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
  // scope : la dernière sheet dans le DOM (les anciennes disparaissent avec 450 ms de retard)
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
