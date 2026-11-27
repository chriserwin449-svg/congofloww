// CongoFlow — Mes événements, Activité, Profil + Paramètres + Suppression
import { t, tx, state, save, ev, userById, avatarHTML, hypeScore, hypeLevel, fmtDate, fmtTime, relTime, plural, submitReport, uid, IMG, setLang, CITIES, icon } from './core.js';
import { eventCardHTML, sheet, reportSheet, ILLU } from './feed.js';
import { deletePostFlow } from './publish.js';
import { cityFromIP, nearestCity } from './data/cities.js';

// ———————————————————— Sélecteur de ville (sheet réutilisable) ————————————————————
export function cityPickerSheet(onDone) {
  const s = state();
  const close = sheet(`
    <h2 class="t-h3">${icon('pin', 18)} ${t('loc.changeCity')}</h2>
    <p class="t-small mt-8">${t('loc.yourCityHint')}</p>
    <div class="city-pick mt-16" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      ${CITIES.map(c => `<button class="city-chip ${c.name === s.user.city ? 'sel' : ''}" data-city="${c.name}">${c.name}</button>`).join('')}
    </div>
    <button class="btn btn-ghost btn-block mt-16" id="cpGeo">${icon('globe', 16)} ${t('loc.geoBtn')}</button>`);
  const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
  sc().querySelectorAll('[data-city]').forEach(b => b.addEventListener('click', () => {
    s.user.city = b.dataset.city; save();
    toast(t('loc.citySet', { city: b.dataset.city }), 'ok');
    close();
    onDone?.();
  }));
  sc().querySelector('#cpGeo').addEventListener('click', async function () {
    this.disabled = true;
    this.innerHTML = t('common.loading');
    let found = null;
    // 1) géolocalisation navigateur → ville la plus proche (rattachement uniquement)
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      found = nearestCity(pos.coords.latitude, pos.coords.longitude);
    } catch (e) { /* refusée ou indisponible */ }
    // 2) sinon IP
    if (!found) found = await cityFromIP();
    if (found) {
      s.user.city = found; save();
      toast(t('loc.citySet', { city: found }), 'ok');
      close();
      onDone?.();
    } else {
      this.disabled = false;
      this.innerHTML = t('loc.geoBtn');
      toast(t('loc.geoDenied'));
    }
  });
  return close;
}

// ———————————————————— Mes événements ————————————————————
export function renderMine(root, nav) {
  const s = state();
  let showPast = false;
  let tab = 'liked'; // liked | published
  const filters = { q: '', date: 'all', city: 'all', type: 'all' };

  root.innerHTML = `
  <div class="mine-page">
    <h1 class="page-title">${t('mine.title')}</h1>
    <div class="tabs two" id="mineTabs">
      <span class="tab-ink" id="mineInk"></span>
      <button class="on" data-tab="liked">${t('mine.tabLiked')}</button>
      <button data-tab="published">${t('mine.tabPublished')}</button>
    </div>
    <div class="search-bar">
      ${icon('search', 16)}
      <input id="mineQ" placeholder="${t('mine.searchPlaceholder')}">
    </div>
    <div class="filter-row" id="mineFilters">
      <select id="f-date"><option value="all">${t('mine.filterDate')} · ${t('mine.filterAll')}</option><option value="week">${t('mine.filterThisWeek')}</option><option value="month">${t('mine.filterThisMonth')}</option></select>
      <select id="f-city"><option value="all">${t('mine.filterCity')} · ${t('mine.filterAll')}</option></select>
      <select id="f-type"><option value="all">${t('mine.filterType')} · ${t('mine.filterAll')}</option>${Object.entries(t('feed.categories')).filter(([k]) => k !== 'all').map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    </div>
    <div id="mineList" class="stack-list"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const list = $('#mineList');

  function render() {
    root.querySelectorAll('#mineTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#mineInk').classList.toggle('right', tab !== 'liked');

    const base = tab === 'liked'
      ? s.myLikes.map(ev).filter(Boolean).filter(e => e.status !== 'removed')
      : s.events.filter(e => e.organizer === s.user.id && e.status === 'ok');
    const now = Date.now();
    let items = base.filter(e => showPast ? new Date(e.date) < now : new Date(e.date) >= now);
    if (filters.q) items = items.filter(e => (tx(e.title) + ' ' + e.area + ' ' + e.commune + ' ' + e.city).toLowerCase().includes(filters.q.toLowerCase()));
    if (filters.date !== 'all') {
      const lim = filters.date === 'week' ? 7 : 30;
      items = items.filter(e => (new Date(e.date) - now) / 864e5 <= lim);
    }
    if (filters.city !== 'all') items = items.filter(e => e.city === filters.city);
    if (filters.type !== 'all') items = items.filter(e => e.category === filters.type);
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    // options villes dynamiques
    const cities = [...new Set(base.map(e => e.city))];
    const sel = $('#f-city');
    if (sel.options.length - 1 !== cities.length) {
      sel.innerHTML = `<option value="all">${t('mine.filterCity')} · ${t('mine.filterAll')}</option>` + cities.map(c => `<option ${filters.city === c ? 'selected' : ''}>${c}</option>`).join('');
    }

    if (!base.length) {
      list.innerHTML = `
      <div class="state-box card">
        <div class="state-illu">${ILLU.seenall()}</div>
        <p class="t-body">${tab === 'liked' ? t('mine.empty') : t('mine.emptyPublished')}</p>
        <button class="btn btn-primary mt-16" id="goFeed">${tab === 'liked' ? t('mine.emptyCta') : t('profile.addPost')}</button>
      </div>`;
      $('#goFeed').addEventListener('click', () => nav(tab === 'liked' ? 'feed' : 'publish'));
      return;
    }
    if (!items.length) {
      list.innerHTML = `<div class="state-box card"><div class="state-illu">${ILLU.noresults()}</div><p class="t-body">${t('mine.noResults')}</p></div>`;
      return;
    }

    list.innerHTML = `
      ${items.map(e => `
      <div class="mine-item card">
        <div class="mi-media"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="${tx(e.title)}" loading="lazy" class="img-prog" onload="this.classList.add('loaded')"></div>
        <div class="mi-body">
          <div class="flex gap-8 ai-c wrap"><span class="badge-hype">${icon('flame', 12)} ${hypeScore(e).toLocaleString()}</span><span class="ev-price ${e.price?.on ? '' : 'free'}">${e.price?.on ? e.price.amount + ' ' + e.price.cur : t('common.free')}</span></div>
          <strong class="mi-title">${tx(e.title)}</strong>
          <span class="t-small mi-meta">${icon('calendar', 12)} ${fmtDate(e.date)} · ${fmtTime(e.date)}</span>
          <span class="t-small mi-meta">${icon('pin', 12)} ${e.area}, ${e.city}</span>
          <div class="mi-actions">
            <button class="btn btn-sm ${s.myReminders.includes(e.id) ? 'btn-dark' : 'btn-ghost'}" data-rem="${e.id}">${t('mine.reminder')}</button>
            <button class="btn btn-sm btn-ghost" data-open="${e.id}">${t('feed.viewDetails')}</button>
            ${tab === 'liked'
              ? `<button class="btn btn-sm btn-ghost danger" data-rm="${e.id}" aria-label="${t('mine.remove')}">${icon('trash', 14)}</button>`
              : `<button class="btn btn-sm btn-ghost" data-edit="${e.id}">${icon('edit', 14)} ${t('common.edit')}</button>`}
          </div>
        </div>
      </div>`).join('')}
      <button class="link-btn center" id="togglePast">${showPast ? t('mine.hidePast') : t('mine.viewPast')}</button>`;

    list.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => import('./feed.js').then(m => m.openDetail(b.dataset.open, nav))));
    list.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => nav('publish', b.dataset.edit)));
    list.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', function () {
      const id = this.dataset.rem;
      if (s.myReminders.includes(id)) { s.myReminders = s.myReminders.filter(x => x !== id); toast(t('mine.reminderOffToast')); }
      else { s.myReminders.push(id); toast(t('mine.reminderToast'), 'ok'); }
      save(); render();
    }));
    list.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.rm;
      s.myLikes = s.myLikes.filter(x => x !== id); save();
      toast(t('mine.removed'));
      render();
    }));
    $('#togglePast')?.addEventListener('click', () => { showPast = !showPast; render(); });
  }

  root.querySelectorAll('#mineTabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  $('#mineQ').addEventListener('input', e => { filters.q = e.target.value; render(); });
  $('#f-date').addEventListener('change', e => { filters.date = e.target.value; render(); });
  $('#f-city').addEventListener('change', e => { filters.city = e.target.value; render(); });
  $('#f-type').addEventListener('change', e => { filters.type = e.target.value; render(); });

  render();
}

// ———————————————————— Activité ————————————————————
export function renderActivity(root, nav, initialTab = 'notif') {
  const s = state();
  let tab = initialTab;

  root.innerHTML = `
  <div class="act-page">
    <div class="act-head">
      <h1 class="page-title">${t('activity.title')}</h1>
      <div class="flex gap-8">
        <button class="act-plus" id="actPlus" aria-label="${t('activity.addLabel')}" title="${t('activity.addLabel')}">${icon('plus', 20)}</button>
      </div>
    </div>

    <!-- Stories (disparaissent après 24 h) -->
    <div class="stories-row" id="storiesRow"></div>

    <div class="tabs three" id="actTabs">
      <span class="tab-ink" id="actInk"></span>
      <button class="${tab === 'notif' ? 'on' : ''}" data-tab="notif">${t('activity.tabNotifications')}${s.notifs.some(n => !n.read) ? ' <span class="notif-dot inline"></span>' : ''}</button>
      <button class="${tab === 'msg' ? 'on' : ''}" data-tab="msg">${t('activity.tabMessages')}</button>
      <button class="${tab === 'stories' ? 'on' : ''}" data-tab="stories">${t('activity.tabMyStories')}</button>
    </div>
    <div id="actBody"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const body = $('#actBody');

  const STORIES_MS = 24 * 3600e3;
  const liveStories = () => (s.stories || []).filter(st => Date.now() - st.ts < STORIES_MS);
  const followedStories = () => liveStories().filter(st => st.by !== (s.user && s.user.id));

  function renderStoriesRow() {
    const mine = liveStories().filter(st => st.by === (s.user && s.user.id));
    const others = followedStories();
    const seen = new Set((s.seenStories || []));
    $('#storiesRow').innerHTML = `
      <button class="story-bubble me ${mine.length ? 'has' : ''}" id="storyMe">
        ${mine.length
          ? `<img src="${mine[mine.length - 1].img}" alt="">`
          : `<span class="sb-plus">${icon('plus', 22)}</span>`}
        <span class="sb-name">${t('activity.storyMine')}</span>
      </button>
      ${others.map(st => {
        const u = userById(st.by);
        return `<button class="story-bubble ${seen.has(st.id) ? 'seen' : ''}" data-story="${st.id}">
          <img src="${st.img}" alt="">
          <span class="sb-name">${(u?.name || '?').split(' ')[0]}</span>
        </button>`;
      }).join('')}`;
    $('#storyMe').addEventListener('click', () => {
      if (mine.length) openStoryViewer(mine.map(st => st.id), 0);
      else createSheet('story');
    });
    root.querySelectorAll('[data-story]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.story;
      s.seenStories = [...new Set([...(s.seenStories || []), id])]; save();
      openStoryViewer(others.map(st => st.id), others.findIndex(st => st.id === id));
    }));
  }

  function openStoryViewer(ids, start) {
    let i = Math.max(0, start), timer = null;
    const backdrop = document.createElement('div');
    backdrop.className = 'story-viewer';
    document.body.appendChild(backdrop);
    const render = () => {
      const st = liveStories().find(x => x.id === ids[i]);
      if (!st) return close();
      const u = userById(st.by);
      const left = Math.max(0, STORIES_MS - (Date.now() - st.ts));
      backdrop.innerHTML = `
        <div class="sv-bars">${ids.map((_, k) => `<span class="${k < i ? 'done' : k === i ? 'run' : ''}"></span>`).join('')}</div>
        <div class="sv-head">
          ${avatarHTML(u)}
          <strong>${u?.name || '?'}</strong>
          <span class="t-small" style="color:rgba(255,255,255,.8)">${relTime(st.ts)}</span>
          <span class="sv-exp t-small" style="color:rgba(255,255,255,.6)">· ${Math.ceil(left / 3600e3)} h</span>
          <button class="sv-close" aria-label="${t('common.close')}">${icon('close', 15)}</button>
        </div>
        <img class="sv-img" src="${st.img}" alt="">
        ${st.caption ? `<p class="sv-caption">${st.caption.replace(/</g, '&lt;')}</p>` : ''}
        <button class="sv-tap left" aria-label="${t('common.back')}"></button>
        <button class="sv-tap right" aria-label="${t('common.next')}"></button>`;
      backdrop.querySelector('.sv-close').addEventListener('click', close);
      backdrop.querySelector('.sv-tap.left').addEventListener('click', () => { if (i > 0) { i--; render(); } });
      backdrop.querySelector('.sv-tap.right').addEventListener('click', next);
      clearTimeout(timer);
      timer = setTimeout(next, 5000);
    };
    function next() { if (i < ids.length - 1) { i++; render(); } else close(); }
    function close() { clearTimeout(timer); backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 200); }
    render();
    requestAnimationFrame(() => backdrop.classList.add('show'));
  }

  function createSheet(kind) {
    const labels = { story: 'activity.addStory', post: 'activity.addPost' };
    const hints = { story: 'activity.addStoryHint', post: 'activity.addPostHint' };
    const iconsK = { story: 'clock', post: 'sparkle' };
    const close = sheet(`
      <h2 class="t-h3">${t('activity.addLabel')}</h2>
      <div class="stack-list mt-16">
        ${['story', 'post'].map(k => `
        <button class="perm-row as-btn" data-k="${k}">
          <strong>${icon(iconsK[k], 18)} ${t(labels[k])}</strong>
          <span class="t-small">${t(hints[k])}</span>
        </button>`).join('')}
      </div>`);
    const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    sc().querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      close();
      if (k === 'story') storyComposer();
      if (k === 'post') nav('publish');
    }));
  }

  function storyComposer() {
    let imgData = null;
    const close = sheet(`
      <h2 class="t-h3">${t('activity.storyNew')}</h2>
      <div class="pub-cover" id="stCover" tabindex="0" role="button" aria-label="${t('activity.storyPick')}">
        <span class="pc-empty">${icon('camera', 26)}<br>${t('activity.storyPick')}</span>
      </div>
      <div class="field mt-16"><label for="stCap">${t('activity.storyCaption')}</label>
        <input id="stCap" maxlength="120" placeholder="${t('activity.storyCaptionPh')}"></div>
      <p class="t-small mt-8">${t('activity.story24h')}</p>
      <button class="btn btn-primary btn-block btn-lg mt-16" id="stGo" disabled>${t('activity.storyPublish')}</button>`);
    const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    const cover = sc().querySelector('#stCover'), go = sc().querySelector('#stGo');
    cover.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.addEventListener('change', () => {
        const f = inp.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          imgData = rd.result; go.disabled = false;
          cover.classList.add('has');
          cover.innerHTML = `<img src="${imgData}" alt="">`;
        };
        rd.readAsDataURL(f);
      });
      inp.click();
    });
    go.addEventListener('click', () => {
      if (!imgData) return;
      s.stories = s.stories || [];
      s.stories.push({ id: uid('st'), by: s.user.id, img: imgData, caption: sc().querySelector('#stCap').value.trim(), ts: Date.now() });
      save(); close(); toast(t('activity.storyPublished'), 'ok');
      renderStoriesRow();
    });
  }

  function renderMyStories() {
    const mine = liveStories().filter(st => st.by === (s.user && s.user.id));
    if (!mine.length) {
      body.innerHTML = `
      <div class="state-box card">
        <div class="state-illu">${ILLU.seenall()}</div>
        <p class="t-body">${t('activity.myStoriesEmpty')}</p>
        <button class="btn btn-primary mt-16" id="msAdd">${t('activity.storyNew')}</button>
      </div>`;
      body.querySelector('#msAdd').addEventListener('click', () => storyComposer());
      return;
    }
    body.innerHTML = `<div class="stack-list">
      ${mine.map(st => `
      <div class="mine-item card">
        <div class="mi-media"><img src="${st.img}" alt=""></div>
        <div class="mi-body">
          <strong>${st.caption || t('activity.storyMine')}</strong>
          <span class="t-small">${relTime(st.ts)} · ${t('activity.storyExpires', { h: Math.ceil((STORIES_MS - (Date.now() - st.ts)) / 3600e3) })}</span>
          <div class="mi-actions">
            <button class="btn btn-sm btn-ghost" data-view="${st.id}">${t('common.see')}</button>
            <button class="btn btn-sm btn-ghost danger" data-del="${st.id}" aria-label="${t('common.delete')}">${icon('trash', 14)}</button>
          </div>
        </div>
      </div>`).join('')}
    </div>`;
    body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => openStoryViewer(mine.map(x => x.id), mine.findIndex(x => x.id === b.dataset.view))));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      s.stories = s.stories.filter(x => x.id !== b.dataset.del); save();
      renderStoriesRow(); renderTab();
    }));
  }

  function renderTab() {
    root.querySelectorAll('#actTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const k = tab === 'notif' ? 0 : tab === 'msg' ? 1 : 2;
    $('#actInk').style.transform = `translateX(${k * 100}%)`;
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
    if (tab === 'notif') renderNotifs(); else if (tab === 'msg') renderMsgs(); else renderMyStories();
  }

  function notifText(n) {
    const name = userById(n.user)?.name || '?';
    switch (n.type) {
      case 'follow': return t('activity.notifFollow', { name });
      case 'like': return t('activity.notifLike', { name, event: n.event ? tx(ev(n.event)?.title) : '' });
      case 'comment': return t('activity.notifComment', { name, event: n.event ? tx(ev(n.event)?.title) : '', text: tx(n.text) });
      case 'boost': return t('activity.notifBoost', { name, event: n.event ? tx(ev(n.event)?.title) : '' });
      case 'hype': return t('activity.notifHype', { event: tx(ev(n.event)?.title) });
      case 'reminder': return t('activity.notifReminder', { event: tx(ev(n.event)?.title) });
      case 'suggestion': return t('activity.notifSuggest', { name });
      default: return '';
    }
  }

  function renderNotifs() {
    if (!s.notifs.length) { body.innerHTML = `<div class="state-box card"><p class="t-body">${t('activity.notifEmpty')}</p></div>`; return; }
    body.innerHTML = `
      <div class="flex jc-b ai-c mb-16">
      <button class="link-btn" id="markRead">${t('activity.notifMarkRead')}</button></div>
      <div class="stack-list">
      ${s.notifs.map((n, i) => `
        <div class="notif-item card ${n.read ? '' : 'unread'}">
          ${avatarHTML(userById(n.user))}
          <div class="ni-body"><span>${notifText(n)}</span><span class="t-small">${relTime(Date.now() - n.ago * 3600e3)}</span></div>
          ${n.read ? '' : `<span class="notif-dot ${i === 0 ? 'pulse' : ''}"></span>`}
        </div>`).join('')}
      </div>`;
    $('#markRead').addEventListener('click', () => { s.notifs.forEach(n => n.read = true); save(); renderTab(); });
  }

  function renderMsgs() {
    if (!s.convs.length) { body.innerHTML = `<div class="state-box card"><p class="t-body">${t('activity.msgEmpty')}</p><p class="t-small mt-8">${t('activity.msgHint')}</p></div>`; return; }
    body.innerHTML = `<div class="stack-list">` + s.convs.map(c => {
      const u = userById(c.user);
      const last = c.messages[c.messages.length - 1];
      return `
      <button class="conv-item card" data-conv="${c.id}">
        ${avatarHTML(u, 'big')}
        <div class="ci-body">
          <strong>${u?.name}</strong>
          <span class="t-small">${tx(last?.text).slice(0, 46)}${tx(last?.text).length > 46 ? '…' : ''}</span>
        </div>
        <span class="t-small">${relTime(Date.now() + (last?.t || 0) * 3600e3)}</span>
      </button>`;
    }).join('') + `</div>`;
    body.querySelectorAll('[data-conv]').forEach(b => b.addEventListener('click', () => openConv(b.dataset.conv, nav)));
  }

  function openConv(id, nav) {
    const c = s.convs.find(x => x.id === id);
    const u = userById(c.user);
    const close = sheet(`
      <div class="conv-head">
        ${avatarHTML(u, 'big')}
        <div><strong>${u?.name}</strong><br><span class="t-small">${t('activity.seen')}</span></div>
        <div class="flex gap-8">
          <button class="icon-btn" id="convReport" aria-label="${t('activity.msgReport')}" title="${t('activity.msgReport')}">${icon('warn', 17)}</button>
          <button class="icon-btn" id="convBlock" aria-label="${t('activity.msgBlock')}" title="${t('activity.msgBlock')}">${icon('block', 17)}</button>
        </div>
      </div>
      <div class="conv-msgs" id="convMsgs">
        ${c.messages.map(m => `
          <div class="cm ${m.from === 'me' ? 'me' : ''}">
            <span>${tx(m.text)}</span>
            <small>${m.from === 'me' ? (m.seen ? t('activity.seen') : t('activity.sent')) : ''}</small>
          </div>`).join('')}
      </div>
      <div class="conv-input">
        <input id="msgInput" placeholder="${t('activity.msgPlaceholder')}" maxlength="300">
        <button class="btn btn-primary btn-sm" id="msgSend">${icon('send', 15)}</button>
      </div>`, { wide: true });
    const box = scopeC().querySelector('#convMsgs');
    box.scrollTop = box.scrollHeight;
    const send = () => {
      const inp = scopeC().querySelector("#msgInput");
      const v = (inp.value || '').trim();
      if (!v) return;
      c.messages.push({ id: uid('m'), from: 'me', text: v, t: 0, seen: false });
      save();
      box.insertAdjacentHTML('beforeend', `<div class="cm me"><span>${v.replace(/</g, '&lt;')}</span><small>${t('activity.sent')}</small></div>`);
      inp.value = ''; box.scrollTop = box.scrollHeight;
      setTimeout(() => {
        c.messages.push({ id: uid('m'), from: c.user, text: { fr: '👍', en: '👍', ln: '👍' }, t: 0 });
        save();
        if (scopeC().querySelector("#convMsgs")) {
          scopeC().querySelector("#convMsgs").insertAdjacentHTML('beforeend', `<div class="cm"><span>👍</span><small></small></div>`);
          scopeC().querySelector("#convMsgs").scrollTop = 1e6;
        }
      }, 1200);
    };
    const scopeC = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    scopeC().querySelector('#msgSend').addEventListener('click', send);
    scopeC().querySelector('#msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    scopeC().querySelector('#convBlock').addEventListener('click', () => {
      const c2 = sheet(`<h2 class="t-h3">${t('activity.msgBlock')}</h2><p class="t-body mt-8">${t('activity.msgBlockConfirm')}</p>
        <div class="flex gap-12 mt-16"><button class="btn btn-ghost" style="flex:1" id="bNo">${t('common.cancel')}</button><button class="btn btn-primary" style="flex:1" id="bYes">${t('activity.msgBlock')}</button></div>`);
      [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#bNo').addEventListener('click', c2);
      [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#bYes').addEventListener('click', () => {
        s.blocked.push(c.user); s.convs = s.convs.filter(x => x.id !== c.id); save();
        c2(); close(); toast(t('activity.msgBlocked'), 'ok'); renderTab();
      });
    });
    scopeC().querySelector('#convReport').addEventListener('click', () => { close(); reportSheet('message', c.id); });
  }

  root.querySelector('#actPlus').addEventListener('click', () => createSheet());
  root.querySelectorAll('#actTabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderTab(); }));
  renderStoriesRow();
  renderTab();
}

// ———————————————————— Profil (moi OU autre utilisateur #/u/:id) ————————————————————
export function renderProfile(root, nav, userId) {
  const s = state();
  const me = s.user;
  const other = userId && userId !== me.id ? userById(userId) : null;
  const u = other || me;
  const isMe = !other;

  const myPosts = s.events.filter(e => e.organizer === u.id && e.status !== 'removed');
  const drafts = myPosts.filter(e => e.status === 'draft');
  const scheduled = myPosts.filter(e => e.status === 'scheduled');
  const published = myPosts.filter(e => e.status === 'ok');
  let tab = 'published'; // published | scheduled | drafts

  // hype du profil : somme des hypés des événements
  const profileHype = myPosts.reduce((a, e) => a + hypeScore(e), 0);
  const hypeMax = Math.max(20000, profileHype * 1.15);

  // badges
  const badges = [];
  if (u.verified) badges.push({ txt: t('profile.badgeVerified'), ic: 'shield', cls: 'b-verif' });
  if (isMe && Date.now() - (u.since || Date.now()) < 30 * 864e5) badges.push({ txt: t('profile.badgeNew'), ic: 'sparkle', cls: 'b-new' });
  const topInCity = s.events.filter(e => e.organizer === u.id && e.city === (u.city || 'Kinshasa')).length >= 3;
  if (topInCity) badges.push({ txt: t('profile.badgeTop', { city: u.city || 'Kinshasa' }), ic: 'flame', cls: 'b-top' });

  // progression « Complète ton profil »
  const steps = [
    { k: 'photo', txt: t('profile.completePhoto'), done: !!u.photo },
    { k: 'bio', txt: t('profile.completeBio'), done: !!(u.bio && tx(u.bio)) },
    { k: 'city', txt: t('profile.completeCity'), done: !!u.city },
    { k: 'interests', txt: t('profile.completeInterests'), done: !!u.interestsDone },
    { k: 'post', txt: t('profile.completePost'), done: published.length > 0 },
  ];
  const doneCount = steps.filter(x => x.done).length;

  // mini-stats organisateur
  const orgStats = published.length ? {
    views: published.reduce((a, e) => a + (e.stats?.views || 0), 0),
    likes: published.reduce((a, e) => a + (e.stats?.likes || 0), 0),
    hypeAvg: Math.round(profileHype / published.length),
    best: published.slice().sort((a, b) => hypeScore(b) - hypeScore(a))[0],
  } : null;

  root.innerHTML = `
  <div class="prof-page">
    <!-- Bandeau de couverture -->
    <div class="prof-cover">
      ${isMe ? `<button class="pc-set" id="pcSet" aria-label="${t('profile.settings')}" title="${t('profile.settings')}">${icon('settings', 20)}</button>` : ''}
      <div class="pc-wax"></div>
    </div>

    <div class="prof-head">
      <div class="ph-top">
        ${u?.photo
          ? `<span class="prof-avatar has-photo"><img src="${u.photo}" alt=""></span>`
          : `<span class="prof-avatar" style="background:${u?.color || '#9B1C28'}">${(u?.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('')}</span>`}
      </div>
      <h1 class="prof-name">${u?.name} ${u?.verified ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="${t('common.verified')}"><circle cx="12" cy="12" r="10" fill="var(--bordeaux)"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</h1>
      <span class="t-small prof-user">@${u?.username}</span>
      ${u?.bio && tx(u.bio) ? `<p class="t-body mt-8">${tx(u.bio)}</p>` : ''}
      <p class="t-small mt-8 prof-meta">${icon('pin', 13)} ${u?.city || '—'} · ${t('profile.memberSince', { date: new Date(u?.since || Date.now()).toLocaleDateString(s.lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' }) })}</p>
      ${badges.length ? `<div class="prof-badges">${badges.map(b => `<span class="pbadge ${b.cls}">${icon(b.ic, 12)} ${b.txt}</span>`).join('')}</div>` : ''}

      <div class="flex gap-8 wrap mt-16">
        ${isMe ? `
        <button class="btn btn-primary btn-sm" id="pEdit">${t('profile.editProfile')}</button>
        <button class="btn btn-ghost btn-sm" id="pShare">${icon('link', 14)} ${t('profile.shareProfile')}</button>` : `
        <button class="btn ${s.follows?.includes(u.id) ? 'btn-dark' : 'btn-primary'} btn-sm" id="pFollow">${s.follows?.includes(u.id) ? t('profile.unfollow') : t('profile.follow')}</button>
        <button class="btn btn-ghost btn-sm" id="pMsg">${t('profile.message')}</button>
        <button class="btn btn-ghost btn-sm danger" id="pReportU">${t('common.report')}</button>
        <button class="btn btn-ghost btn-sm danger" id="pBlockU">${t('common.block')}</button>`}
      </div>

      <!-- Statistiques : 3 cartes sobres, cliquables -->
      <div class="prof-stats3">
        <button class="ps3" id="psPosts"><strong>${published.length}</strong><span>${t('profile.posts')}</span></button>
        <button class="ps3" id="psFollowers"><strong>${(u?.followers || 0).toLocaleString()}</strong><span>${t('profile.followers')}</span></button>
        <button class="ps3" id="psFollowing"><strong>${(u?.following || 0).toLocaleString()}</strong><span>${t('profile.following')}</span></button>
      </div>

      <!-- Hype du profil -->
      <div class="prof-hype">
        <div class="flex jc-b ai-c"><span class="t-small"><strong>${icon('flame', 13)} ${t('profile.hypeScore')}</strong></span><span class="t-small">${profileHype.toLocaleString()}</span></div>
        <div class="ph-gauge"><i style="width:${Math.min(100, profileHype / hypeMax * 100)}%"></i></div>
        <span class="t-small">${t('profile.hypeHint')}</span>
      </div>
    </div>

    ${isMe && doneCount < steps.length ? `
    <!-- Complète ton profil -->
    <div class="prof-progress card">
      <div class="flex jc-b ai-c mb-8">
        <h2 class="t-h3">${t('profile.completeTitle')}</h2>
        <span class="t-small">${doneCount}/${steps.length}</span>
      </div>
      <div class="pp-bar"><i style="width:${doneCount / steps.length * 100}%"></i></div>
      <div class="pp-steps">
        ${steps.map(x => `<span class="pp-step ${x.done ? 'done' : ''}">${x.done ? icon('check', 13) : ''} ${x.txt}</span>`).join('')}
      </div>
      ${doneCount === steps.length - 0 ? '' : ''}
    </div>` : ''}

    ${isMe && published.length ? `
    <!-- Mini-stats organisateur -->
    <div class="org-stats card">
      <h2 class="t-h3">${icon('chart', 15)} ${t('profile.orgStats')}</h2>
      <div class="os-grid">
        <div><strong>${orgStats.views.toLocaleString()}</strong><span>${t('profile.orgViews')}</span></div>
        <div><strong>${orgStats.likes.toLocaleString()}</strong><span>${t('profile.orgLikes')}</span></div>
        <div><strong>${orgStats.hypeAvg.toLocaleString()}</strong><span>${t('profile.orgHype')}</span></div>
      </div>
      <p class="t-small mt-8">${icon('flame', 12)} ${t('profile.orgBest')} : <strong>${tx(orgStats.best.title)}</strong></p>
    </div>` : ''}

    <!-- Onglets -->
    <div class="tabs three" id="profTabs">
      <span class="tab-ink" id="profInk"></span>
      <button class="on" data-tab="published">${t('profile.tabPublished')}</button>
      <button data-tab="scheduled">${t('profile.tabScheduled')}</button>
      <button data-tab="drafts">${t('profile.tabDrafts')}</button>
    </div>

    <div id="profBody"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);

  function renderTab() {
    root.querySelectorAll('#profTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const k = tab === 'published' ? 0 : tab === 'scheduled' ? 1 : 2;
    $('#profInk').style.transform = `translateX(${k * 100}%)`;
    const list = tab === 'published' ? published : tab === 'scheduled' ? scheduled : drafts;

    if (!list.length) {
      const isFirst = isMe && tab === 'published' && !myPosts.length;
      $('#profBody').innerHTML = `
      <div class="state-box card">
        ${isFirst ? `<div class="state-illu">${ILLU.seenall()}</div>` : ''}
        <p class="t-body">${isFirst ? t('profile.emptyGrid') : (tab === 'scheduled' ? t('publish.scheduled') : t('publish.drafts'))}</p>
        ${isFirst ? `<button class="btn btn-primary btn-sm mt-12" id="gAdd">${icon('plus', 15)} ${t('profile.addPost')}</button>` : ''}
      </div>`;
      $('#gAdd')?.addEventListener('click', () => nav('publish'));
      return;
    }

    // Grille d'affiches (3 colonnes, 2 sur mobile) + menu ⋯ par post
    $('#profBody').innerHTML = `
    <div class="prof-grid">
      ${list.map(e => `
      <div class="pg-item" data-ev="${e.id}" tabindex="0" role="button" aria-label="${tx(e.title)}">
        <img src="${e.img && !e.img.startsWith('data:') && e.img ? IMG('w-poster-' + e.img) : (e.img || '')}" alt="${tx(e.title)}" loading="lazy" class="img-prog" onload="this.classList.add('loaded')">
        <div class="pg-over"><span class="badge-hype">${icon('flame', 11)} ${hypeScore(e).toLocaleString()}</span></div>
        ${isMe ? `
        <button class="pg-menu-btn" data-menu="${e.id}" aria-label="${t('common.more')}">${icon('dots', 18)}</button>
        <div class="pg-menu" id="pm-${e.id}">
          <button data-edit="${e.id}">${icon('edit', 14)} ${t('profile.menuEdit')}</button>
          <button data-sched="${e.id}">${icon('clock', 14)} ${t('profile.menuSchedule')}</button>
          <button data-copy="${e.id}">${icon('copy', 14)} ${t('profile.menuCopy')}</button>
          <button class="danger" data-del="${e.id}">${icon('trash', 14)} ${t('profile.menuDelete')}</button>
        </div>` : ''}
      </div>`).join('')}
    </div>`;

    $('#profBody').querySelectorAll('[data-ev]').forEach(el => el.addEventListener('click', e => {
      if (e.target.closest('.pg-menu') || e.target.closest('.pg-menu-btn')) return;
      openDetail(el.dataset.ev, nav);
    }));
    $('#profBody').querySelectorAll('[data-ev]').forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(el.dataset.ev, nav); }));
    // menu ⋯
    $('#profBody').querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = document.getElementById('pm-' + b.dataset.menu);
      document.querySelectorAll('.pg-menu.show').forEach(x => { if (x !== m) x.classList.remove('show'); });
      m.classList.toggle('show');
    }));
    document.addEventListener('click', () => document.querySelectorAll('.pg-menu.show').forEach(x => x.classList.remove('show')), { once: true });
    $('#profBody').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => nav('publish', b.dataset.edit)));
    $('#profBody').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deletePostFlow(b.dataset.del, nav)));
    $('#profBody').querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      navigator.clipboard?.writeText(location.origin + location.pathname + '#/ev/' + b.dataset.copy).catch(() => {});
      toast(t('common.copied'), 'ok');
    }));
    $('#profBody').querySelectorAll('[data-sched]').forEach(b => b.addEventListener('click', () => nav('publish', b.dataset.sched)));
  }

  // Actions du profil
  $('#pcSet')?.addEventListener('click', () => settingsPage(root, nav));
  $('#pEdit')?.addEventListener('click', () => editProfileSheet(u, () => renderProfile(root, nav, userId)));
  $('#pShare')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(location.origin + location.pathname + '#/u/' + u.id).catch(() => {});
    toast(t('profile.shareCopied'), 'ok');
  });
  $('#pFollow')?.addEventListener('click', function () {
    s.follows = s.follows || [];
    if (s.follows.includes(u.id)) {
      s.follows = s.follows.filter(x => x !== u.id); u.followers = Math.max(0, (u.followers || 1) - 1);
      this.textContent = t('profile.follow'); this.classList.replace('btn-dark', 'btn-primary');
      toast(t('feed.unfollowDone'));
    } else {
      s.follows.push(u.id); u.followers = (u.followers || 0) + 1;
      this.textContent = t('profile.unfollow'); this.classList.replace('btn-primary', 'btn-dark');
      toast(t('feed.followDone'), 'ok');
    }
    save();
  });
  $('#pMsg')?.addEventListener('click', () => {
    let conv = s.convs.find(c => c.user === u.id);
    if (!conv) { conv = { id: uid('c'), user: u.id, messages: [] }; s.convs.unshift(conv); save(); }
    nav('activity', 'messages');
  });
  $('#pReportU')?.addEventListener('click', () => reportSheet('account', u.id));
  $('#pBlockU')?.addEventListener('click', () => {
    s.blocked.push(u.id); save();
    toast(t('activity.msgBlocked'), 'ok');
    nav('feed');
  });
  // stats cliquables → listes
  $('#psFollowers')?.addEventListener('click', () => listSheet(t('profile.listFollowers', { name: u.name }), (u.followers || 0)));
  $('#psFollowing')?.addEventListener('click', () => listSheet(t('profile.listFollowing', { name: u.name }), (u.following || 0)));
  $('#psPosts')?.addEventListener('click', () => { tab = 'published'; renderTab(); });

  function listSheet(title, n) {
    const c = sheet(`
      <h2 class="t-h3">${title}</h2>
      <p class="t-small mt-8">${n.toLocaleString()}</p>
      <div class="stack-list mt-16">
        ${suggestedListFallback(u).map(x => `
        <div class="fc-follow">${avatarHTML(x)}<div class="fcf-body"><strong>${x.name}</strong><span class="t-small">@${x.username}</span></div>
        <button class="btn btn-ghost btn-sm" data-follow="${x.id}">${t('common.follow')}</button></div>`).join('')}
      </div>`);
    [...document.querySelectorAll('.sheet-backdrop')].pop().querySelectorAll('[data-follow]').forEach(b => b.addEventListener('click', function () {
      s.follows = [...new Set([...(s.follows || []), b.dataset.follow])];
      save(); this.textContent = '✓'; this.disabled = true;
    }));
  }
  function suggestedListFallback(u) {
    return s.users.filter(x => x.id !== u.id).slice(0, 6);
  }

  root.querySelectorAll('#profTabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderTab(); }));
  renderTab();
}

// ————— Modifier le profil (sheet) —————
function editProfileSheet(me, onDone) {
  const close = sheet(`
    <h2 class="t-h3">${t('profile.editTitle')}</h2>
    <div class="field mt-16"><label>${t('profile.photoLabel')}</label>
      <div class="flex gap-12 ai-c">
        <span class="prof-avatar" id="epAv" style="background:${me.color}">${me.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
        <button class="btn btn-ghost btn-sm" id="epPhoto">${t('profile.photoButton')}</button>
        <input type="color" id="epColor" value="${me.color}" aria-label="${t('profile.photoLabel')}" style="width:44px;height:44px;border:0;background:none;border-radius:50%">
      </div></div>
    <div class="field"><label for="ep-name">${t('auth.name')}</label><input id="ep-name" value="${me.name}" maxlength="40"></div>
    <div class="field"><label for="ep-bio">${t('profile.bioLabel')} <span class="t-small">(150)</span></label><textarea id="ep-bio" maxlength="150" placeholder="${t('profile.bioPlaceholder')}">${tx(me.bio) || ''}</textarea></div>
    <div class="field"><label for="ep-city">${t('loc.yourCity')}</label>
      <select id="ep-city">${CITIES.map(c => `<option ${c.name === me.city ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
    <button class="btn btn-primary btn-block btn-lg mt-16" id="epSave">${t('common.save')}</button>`);
  const epScope = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
  const av = epScope().querySelector('#epAv');
  epScope().querySelector('#epColor').addEventListener('input', e => { av.style.background = e.target.value; });
  epScope().querySelector('#epPhoto').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { me.photo = rd.result; av.innerHTML = `<img src="${rd.result}" alt="">`; av.style.background = 'none'; };
      rd.readAsDataURL(f);
    });
    inp.click();
  });
  epScope().querySelector('#epSave').addEventListener('click', () => {
    me.name = epScope().querySelector('#ep-name').value.trim() || me.name;
    const bio = epScope().querySelector('#ep-bio').value.trim();
    me.bio = { fr: bio, en: bio, ln: bio };
    me.color = epScope().querySelector('#epColor').value;
    me.city = epScope().querySelector('#ep-city').value;
    save(); close(); toast(t('profile.savedToast'), 'ok'); onDone?.();
  });
}

// ———————————————————— Page Paramètres (page complète, en sections) ————————————————————
export function settingsPage(root, nav) {
  const s = state();
  const st = s.settings;

  root.innerHTML = `
  <div class="set-page">
    <div class="act-head">
      <button class="btn btn-ghost btn-sm" id="setBack">${icon('chevL', 16)} ${t('common.back')}</button>
      <h1 class="page-title">${t('settings.title')}</h1>
    </div>

    <!-- Compte -->
    <section class="set-sec card">
      <h2 class="t-h3">${t('settings.account')}</h2>
      <button class="perm-row as-btn" id="sEdit"><strong>${t('settings.editProfile')}</strong><span>${icon('chevR', 16)}</span></button>
      <div class="perm-row"><strong>${t('settings.email')}</strong><span class="t-small">${s.user.email}</span></div>
      <div class="perm-row"><strong>${t('settings.phone')}</strong><span class="t-small">${s.user.phone || '—'}</span></div>
      <button class="perm-row as-btn" id="sPwd"><strong>${t('settings.password')}</strong><span>${icon('chevR', 16)}</span></button>
      <button class="perm-row as-btn" id="sVerify"><strong>${icon('shield', 15)} ${t('settings.verify')}</strong><span>${icon('chevR', 16)}</span></button>
      <p class="t-small set-hint">${t('settings.verifyHint')}</p>
    </section>

    <!-- Localisation -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('pin', 15)} ${t('settings.location')}</h2>
      <div class="perm-row"><strong>${t('loc.yourCity')}</strong><span class="t-small">${s.user.city}</span></div>
      <div class="perm-row"><strong>${t('loc.autoDetect')}</strong>
        <label class="switch"><input type="checkbox" data-set="autoCity" ${st.autoCity ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <button class="perm-row as-btn" id="sCity"><strong>${t('loc.changeCity')}</strong><span>${icon('chevR', 16)}</span></button>
      <div class="perm-row"><div><strong>${t('loc.otherCitiesHyped')}</strong><p class="t-small">${t('loc.otherCitiesHint')}</p></div>
        <label class="switch"><input type="checkbox" data-set="otherCitiesHyped" ${st.otherCitiesHyped ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="field"><label for="s-commune">${t('loc.communeOptional')}</label><input id="s-commune" value="${s.user.commune || ''}" placeholder="Gombe, Himbi…"></div>
    </section>

    <!-- Langue -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('globe', 15)} ${t('settings.language')}</h2>
      <div class="perm-row"><strong>${t('settings.language')}</strong><div class="lang-menu" id="langSet"></div></div>
    </section>

    <!-- Notifications -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('bell', 15)} ${t('settings.notifications')}</h2>
      ${[['notifLikes', t('settings.notifLikes')], ['notifFollows', t('settings.notifFollows')], ['notifMessages', t('settings.notifMessages')], ['notifReminders', t('settings.notifReminders')], ['notifHype', t('settings.notifHype')]].map(([k, label]) => `
      <div class="perm-row"><strong>${label}</strong>
        <label class="switch"><input type="checkbox" data-set="${k}" ${st[k] ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>`).join('')}
      <div class="set-sub">${t('settings.channelPush')} / ${t('settings.channelEmail')} / ${t('settings.channelSms')} :</div>
      ${[['channelPush', t('settings.channelPush')], ['channelEmail', t('settings.channelEmail')], ['channelSms', t('settings.channelSms')]].map(([k, label]) => `
      <div class="perm-row"><strong>${label}</strong>
        <label class="switch"><input type="checkbox" data-set="${k}" ${st[k] ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>`).join('')}
    </section>

    <!-- Confidentialité -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('lock', 15)} ${t('settings.privacy')}</h2>
      <div class="perm-row"><strong>${t('settings.allowDM')}</strong>
        <select id="sAllowDM">
          <option value="everyone" ${st.allowDM === 'everyone' ? 'selected' : ''}>${t('settings.allowDMEveryone')}</option>
          <option value="follow" ${st.allowDM === 'follow' ? 'selected' : ''}>${t('settings.allowDMFollow')}</option>
          <option value="none" ${st.allowDM === 'none' ? 'selected' : ''}>${t('settings.allowDMNone')}</option>
        </select></div>
      <div class="perm-row"><strong>${t('settings.privateLikes')}</strong>
        <label class="switch"><input type="checkbox" data-set="privateLikes" ${st.privateLikes ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <button class="perm-row as-btn" id="sBlocked"><strong>${icon('block', 15)} ${t('settings.blocked')}</strong><span>${icon('chevR', 16)}</span></button>
      <div class="perm-row"><strong>${t('settings.profileVisible')}</strong>
        <select id="sProfileVis">
          <option value="everyone" ${st.profileVisible === 'everyone' ? 'selected' : ''}>${t('settings.allowDMEveryone')}</option>
          <option value="follow" ${st.profileVisible === 'follow' ? 'selected' : ''}>${t('settings.allowDMFollow')}</option>
        </select></div>
    </section>

    <!-- Centres d'intérêt -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('sparkle', 15)} ${t('settings.interests')}</h2>
      <button class="perm-row as-btn" id="sInterests"><strong>${t('settings.interests')}</strong><span class="t-small">${t('settings.interestsHint')}</span></button>
    </section>

    <!-- Mes données -->
    <section class="set-sec card">
      <h2 class="t-h3">${icon('download', 15)} ${t('settings.myData')}</h2>
      <button class="perm-row as-btn" id="sData"><strong>${t('settings.myData')}</strong><span class="t-small">${t('settings.myDataHint')}</span></button>
    </section>

    <!-- Aide -->
    <section class="set-sec card">
      <h2 class="t-h3">${t('settings.help')}</h2>
      <button class="perm-row as-btn" id="sTuto"><strong>${t('settings.seeTutorial')}</strong><span>${icon('chevR', 16)}</span></button>
      <a class="perm-row as-btn" href="#faq"><strong>${t('settings.faq')}</strong><span>${icon('chevR', 16)}</span></a>
      <button class="perm-row as-btn" id="sContact"><strong>${t('settings.contact')}</strong><span>${icon('chevR', 16)}</span></button>
      <button class="perm-row as-btn" id="sProblem"><strong>${t('settings.reportProblem')}</strong><span>${icon('chevR', 16)}</span></button>
    </section>

    <!-- À propos -->
    <section class="set-sec card">
      <h2 class="t-h3">${t('settings.about')}</h2>
      <div class="perm-row"><strong>${t('settings.version')}</strong><span class="t-small">CongoFlow v1.2</span></div>
      <a class="perm-row as-btn" href="#/legal/rules"><strong>${t('settings.rules')}</strong><span>${icon('chevR', 16)}</span></a>
      <a class="perm-row as-btn" href="#/legal/cgv"><strong>${t('settings.cgv')}</strong><span>${icon('chevR', 16)}</span></a>
      <a class="perm-row as-btn" href="#/legal/privacy"><strong>${t('settings.privacyPolicy')}</strong><span>${icon('chevR', 16)}</span></a>
    </section>

    <!-- Déconnexion + suppression, séparés -->
    <div class="set-endgap"></div>
    <button class="btn btn-ghost btn-block" id="sLogout">${icon('logout', 16)} ${t('settings.logout')}</button>
    <div class="set-endgap"></div>
    <button class="btn btn-ghost btn-block danger" id="sDelete">${icon('trash', 16)} ${t('settings.deleteAccount')}</button>
    <p class="t-small center mt-16">CongoFlow v1.2 · ${t('states.demoAccount')}</p>
    <div class="set-endgap"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);

  $('#setBack').addEventListener('click', () => nav('profile'));
  $('#sEdit').addEventListener('click', () => editProfileSheet(s.user, () => settingsPage(root, nav)));
  $('#sPwd').addEventListener('click', () => {
    const c = sheet(`<h2 class="t-h3">${t('settings.password')}</h2>
      <div class="field mt-16"><label>Nouveau</label><input type="password" id="np1" autocomplete="new-password"></div>
      <div class="field"><label>Confirmation</label><input type="password" id="np2" autocomplete="new-password"></div>
      <button class="btn btn-primary btn-block btn-lg mt-16" id="npGo">${t('common.save')}</button>`);
    const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    sc().querySelector('#npGo').addEventListener('click', () => {
      const a = sc().querySelector('#np1').value, b = sc().querySelector('#np2').value;
      if (a.length < 8 || !/\d/.test(a)) return toast(t('auth.errPasswordShort'), 'err');
      if (a !== b) return toast(t('auth.errPasswordMismatch'), 'err');
      c(); toast(t('profile.savedToast'), 'ok');
    });
  });
  $('#sVerify').addEventListener('click', () => toast(s.user.verified ? t('common.verified') + ' ✓' : t('settings.verifyHint')));
  $('#sCity').addEventListener('click', () => cityPickerSheet(() => settingsPage(root, nav)));
  $('#sBlocked').addEventListener('click', () => {
    const c2 = sheet(`<h2 class="t-h3">${t('settings.blocked')}</h2>
      ${s.blocked.length ? s.blocked.map(b => `<div class="perm-row"><strong>${userById(b)?.name || b}</strong><button class="btn btn-ghost btn-sm" data-un="${b}">${t('settings.unblock')}</button></div>`).join('') : `<p class="t-body mt-16">${t('settings.blockedEmpty')}</p>`}`);
    [...document.querySelectorAll('.sheet-backdrop')].pop().querySelectorAll('[data-un]').forEach(btn => btn.addEventListener('click', () => {
      s.blocked = s.blocked.filter(x => x !== btn.dataset.un); save();
      toast(t('settings.unblocked'), 'ok'); c2(); settingsPage(root, nav);
    }));
  });
  $('#sInterests').addEventListener('click', () => { location.hash = '#/onboarding'; });
  $('#sData').addEventListener('click', () => {
    // téléchargement d'une copie des données (JSON)
    const blob = new Blob([JSON.stringify({ user: s.user, likes: s.myLikes, events: s.events.filter(e => e.organizer === s.user.id) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'congoflow-mes-donnees.json';
    a.click();
    toast(t('settings.myDataDone'), 'ok');
  });
  $('#sTuto').addEventListener('click', () => {
    s.user.seenIntro = false; s.seenIntro = false; save();
    nav('feed');
  });
  $('#sContact').addEventListener('click', () => toast(t('landing.footerLinks.contact') + ' : bonjour@congoflow.cd'));
  $('#sProblem').addEventListener('click', () => reportSheet('message', 'app'));

  // interrupteurs animés
  root.querySelectorAll('[data-set]').forEach(sw => sw.addEventListener('change', function () {
    s.settings[this.dataset.set] = this.checked; save();
  }));
  $('#sAllowDM').addEventListener('change', e => { s.settings.allowDM = e.target.value; save(); });
  $('#sProfileVis').addEventListener('change', e => { s.settings.profileVisible = e.target.value; save(); });
  $('#s-commune')?.addEventListener('change', e => { s.user.commune = e.target.value.trim(); save(); });
  renderLangPicker(root.querySelector('#langSet'), () => settingsPage(root, nav));

  // Déconnexion : confirmation
  $('#sLogout').addEventListener('click', () => {
    const c2 = sheet(`<h2 class="t-h3">${t('settings.logout')}</h2><p class="t-body mt-8">${t('settings.logoutConfirm')}</p>
      <div class="flex gap-12 mt-16">
        <button class="btn btn-ghost" style="flex:1" id="loNo">${t('settings.logoutNo')}</button>
        <button class="btn btn-primary" style="flex:1" id="loYes">${t('settings.logoutYes')}</button>
      </div>`);
    const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    sc().querySelector('#loNo').addEventListener('click', c2);
    sc().querySelector('#loYes').addEventListener('click', () => { s.user = null; save(); c2(); location.hash = '#/'; });
  });

  // Suppression : 3 pages successives avec glissement
  $('#sDelete').addEventListener('click', () => deleteFlow(root, nav));
}

// ————— Suppression de compte : 3 pages + délai de grâce 30 jours —————
function deleteFlow(root, nav) {
  const s = state();
  let reason = null;
  const wrap = document.createElement('div');
  wrap.className = 'del-flow';
  wrap.innerHTML = `<div class="del-track" id="delTrack"></div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));

  const track = wrap.querySelector('#delTrack');

  function slideTo(html) {
    const page = document.createElement('div');
    page.className = 'del-page';
    page.innerHTML = html;
    track.appendChild(page);
    requestAnimationFrame(() => page.classList.add('in'));
    track.style.transform = `translateX(-${(track.children.length - 1) * 100}%)`;
    return page;
  }

  // Page 1 : confirmation + conséquences + délai de grâce
  const p1 = slideTo(`
    <h2 class="t-h2">${t('settings.del1Title')}</h2>
    <p class="t-body mt-16"><strong>${t('settings.del1Consequences')}</strong></p>
    <ul class="del-cons">
      <li>${t('settings.del1c1')}</li>
      <li>${t('settings.del1c2')}</li>
      <li>${t('settings.del1c3')}</li>
    </ul>
    <p class="del-grace t-small">${icon('clock', 13)} ${t('settings.del1Grace')}</p>
    <div class="flex gap-12 mt-24">
      <button class="btn btn-ghost" style="flex:1" id="d1No">${t('settings.del1No')}</button>
      <button class="btn btn-primary" style="flex:1;background:var(--err)" id="d1Yes">${t('settings.del1Yes')}</button>
    </div>`);
  p1.querySelector('#d1No').addEventListener('click', close);
  p1.querySelector('#d1Yes').addEventListener('click', page2);

  // Page 2 : raison unique parmi 8 + champ libre si « Autre »
  function page2() {
    const reasons = t('settings.del2Reasons');
    const p2 = slideTo(`
      <h2 class="t-h2">${t('settings.del2Title')}</h2>
      <div class="rep-list mt-16">
        ${reasons.map((r, i) => `<button class="rep-opt" data-r="${i}"><span>${r}</span><span class="rep-radio"></span></button>`).join('')}
      </div>
      <div class="field mt-16 hidden" id="d2Other"><textarea id="d2Note" maxlength="200" placeholder="${t('settings.del2Other')}"></textarea></div>
      <div class="flex gap-12 mt-24">
        <button class="btn btn-ghost" style="flex:0 0 auto" id="d2Back">${t('settings.del2Back')}</button>
        <button class="btn btn-primary" style="flex:1" id="d2Next" disabled>${t('settings.del2Next')}</button>
      </div>`);
    p2.querySelectorAll('.rep-opt').forEach(b => b.addEventListener('click', () => {
      p2.querySelectorAll('.rep-opt').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); reason = b.dataset.r;
      p2.querySelector('#d2Other').classList.toggle('hidden', reason !== '7');
      p2.querySelector('#d2Next').disabled = false;
    }));
    p2.querySelector('#d2Back').addEventListener('click', () => back(p2));
    p2.querySelector('#d2Next').addEventListener('click', page3);
  }

  // Page 3 : recopier le nom d'utilisateur — bouton désactivé tant que ≠
  function page3() {
    const username = s.user.username;
    const p3 = slideTo(`
      <h2 class="t-h2">${t('settings.del3Title')}</h2>
      <p class="t-body mt-16">${t('settings.del3Text')} <strong>« ${username} »</strong></p>
      <div class="field mt-16"><input id="d3Input" placeholder="${t('settings.del3Placeholder', { username })}" autocomplete="off" spellcheck="false"></div>
      <p class="field-msg" id="d3Err" role="alert">${t('settings.del3Error')}</p>
      <div class="flex gap-12 mt-24">
        <button class="btn btn-ghost" style="flex:0 0 auto" id="d3Back">${t('settings.del2Back')}</button>
        <button class="btn btn-primary" style="flex:1;background:var(--err)" id="d3Go" disabled>${t('settings.del3Btn')}</button>
      </div>`);
    const inp = p3.querySelector('#d3Input'), go = p3.querySelector('#d3Go'), err = p3.querySelector('#d3Err');
    inp.addEventListener('input', () => {
      const ok = inp.value.trim() === username;
      go.disabled = !ok;
      err.classList.toggle('show', !ok && inp.value.trim().length >= Math.max(2, username.length - 2));
    });
    p3.querySelector('#d3Back').addEventListener('click', () => back(p3));
    p3.querySelector('#d3Go').addEventListener('click', () => {
      // raison enregistrée anonymement (statistiques)
      s.deleteReasons.push({ reason, note: wrap.querySelector('#d2Note')?.value?.trim() || '', ts: Date.now() });
      // marquage du délai de grâce : 30 jours pour annuler en se reconnectant
      localStorage.setItem('congoflow_delete_at', String(Date.now() + 30 * 864e5));
      s.user.pendingDelete = true;
      s.deleteReasonsSaved = true;
      save();
      close();
      // écran d'au revoir
      goodbye();
    });
  }

  function back(page) {
    page.remove();
    track.style.transform = `translateX(-${(track.children.length - 1) * 100}%)`;
  }
  function close() {
    wrap.classList.remove('show');
    setTimeout(() => wrap.remove(), 400);
  }
  function goodbye() {
    const gd = document.createElement('div');
    gd.className = 'del-goodbye';
    gd.innerHTML = `
      <div class="dgb-inner card-drop">
        <h2 class="t-h2">${t('settings.delGoodbye')}</h2>
        <p class="t-body mt-8">${t('settings.delDone')}</p>
      </div>`;
    document.body.appendChild(gd);
    setTimeout(() => {
      gd.classList.add('fade');
      localStorage.removeItem('congoflow_v1');
      setTimeout(() => location.hash = '#/', 600);
    }, 2600);
  }
}

// Sélecteur de langue réutilisable
export function renderLangPicker(el, onChange) {
  if (!el) return;
  const s = state();
  const names = { fr: 'Français', en: 'English', ln: 'Lingala ⚠︎' };
  el.classList.remove('on-dark');
  el.innerHTML = `
    <button class="lang-btn" aria-haspopup="true" aria-expanded="false">${s.lang.toUpperCase()} ▾</button>
    <div class="lang-pop" role="menu">
      ${['fr', 'en', 'ln'].map(l => `<button role="menuitem" data-l="${l}" class="${s.lang === l ? 'cur' : ''}"><span>${names[l]}</span>${s.lang === l ? '✓' : ''}</button>`).join('')}
    </div>`;
  const btn = el.querySelector('.lang-btn'), pop = el.querySelector('.lang-pop');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const on = el.classList.toggle('on');
    btn.setAttribute('aria-expanded', on);
    pop.classList.toggle('show', on);
  });
  pop.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.l);
    pop.classList.remove('show'); el.classList.remove('on');
    onChange?.();
  }));
  document.addEventListener('click', () => { pop.classList.remove('show'); el.classList.remove('on'); }, { once: true });
}
