// CongoFlow — Mes événements, Activité (notifications + messages), Profil + Paramètres
import { t, tx, state, save, ev, userById, avatarHTML, hypeScore, fmtDate, fmtTime, relTime, plural, submitReport, uid, IMG, setLang } from './core.js';
import { eventCardHTML, sheet, reportSheet, ILLU } from './feed.js';
import { deletePostFlow } from './publish.js';

// ———————————————————— Mes événements ————————————————————
export function renderMine(root, nav) {
  const s = state();
  let showPast = false;
  let tab = 'liked'; // liked | published
  const filters = { q: '', date: 'all', area: 'all', type: 'all' };

  root.innerHTML = `
  <div class="mine-page">
    <h1 class="page-title">${t('mine.title')}</h1>
    <div class="tabs two" id="mineTabs">
      <span class="tab-ink" id="mineInk"></span>
      <button class="on" data-tab="liked">${t('mine.tabLiked')}</button>
      <button data-tab="published">${t('mine.tabPublished')}</button>
    </div>
    <div class="search-bar">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="mineQ" placeholder="${t('mine.searchPlaceholder')}">
    </div>
    <div class="filter-row" id="mineFilters">
      <select id="f-date"><option value="all">${t('mine.filterDate')} · ${t('mine.filterAll')}</option><option value="week">${t('mine.filterThisWeek')}</option><option value="month">${t('mine.filterThisMonth')}</option></select>
      <select id="f-area"><option value="all">${t('mine.filterArea')} · ${t('mine.filterAll')}</option></select>
      <select id="f-type"><option value="all">${t('mine.filterType')} · ${t('mine.filterAll')}</option>${Object.entries(t('feed.categories')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    </div>
    <div id="mineList" class="stack-list"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const list = $('#mineList');

  function render() {
    root.querySelectorAll('#mineTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#mineInk').classList.toggle('right', tab !== 'liked');

    // source : événements aimés OU publiés par moi
    const base = tab === 'liked'
      ? s.myLikes.map(ev).filter(Boolean).filter(e => e.status !== 'removed')
      : s.events.filter(e => e.organizer === 'me' && e.status === 'ok');
    const now = Date.now();
    let items = base.filter(e => showPast ? new Date(e.date) < now : new Date(e.date) >= now);
    if (filters.q) items = items.filter(e => (tx(e.title) + ' ' + e.area + ' ' + e.commune).toLowerCase().includes(filters.q.toLowerCase()));
    if (filters.date !== 'all') {
      const lim = filters.date === 'week' ? 7 : 30;
      items = items.filter(e => (new Date(e.date) - now) / 864e5 <= lim);
    }
    if (filters.area !== 'all') items = items.filter(e => e.commune === filters.area || e.area === filters.area);
    if (filters.type !== 'all') items = items.filter(e => e.category === filters.type);
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    // options quartiers dynamiques
    const areas = [...new Set(base.map(e => e.commune))];
    const sel = $('#f-area');
    if (sel.options.length - 1 !== areas.length) {
      sel.innerHTML = `<option value="all">${t('mine.filterArea')} · ${t('mine.filterAll')}</option>` + areas.map(a => `<option ${filters.area === a ? 'selected' : ''}>${a}</option>`).join('');
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
        <div class="mi-media"><img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="" loading="lazy" class="img-prog" onload="this.classList.add('loaded')"></div>
        <div class="mi-body">
          <div class="flex gap-8 ai-c wrap"><span class="badge-hype">🔥 ${hypeScore(e).toLocaleString()}</span><span class="ev-price ${e.price?.on ? '' : 'free'}">${e.price?.on ? e.price.amount + ' ' + e.price.cur : t('common.free')}</span></div>
          <strong class="mi-title">${tx(e.title)}</strong>
          <span class="t-small">📅 ${fmtDate(e.date)} · ${fmtTime(e.date)}</span>
          <span class="t-small">📍 ${e.area}, ${e.commune}</span>
          <div class="mi-actions">
            <button class="btn btn-sm ${s.myReminders.includes(e.id) ? 'btn-dark' : 'btn-ghost'}" data-rem="${e.id}">${s.myReminders.includes(e.id) ? '🔔' : '🔕'} ${t('mine.reminder')}</button>
            <button class="btn btn-sm btn-ghost" data-open="${e.id}">${t('feed.viewDetails')}</button>
            ${tab === 'liked'
              ? `<button class="btn btn-sm btn-ghost danger" data-rm="${e.id}" aria-label="${t('mine.remove')}">🗑️</button>`
              : `<button class="btn btn-sm btn-ghost" data-edit="${e.id}">✏️ ${t('common.edit')}</button>`}
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
  $('#f-area').addEventListener('change', e => { filters.area = e.target.value; render(); });
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
        <button class="act-plus" id="actPlus" aria-label="${t('activity.addLabel')}" title="${t('activity.addLabel')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        <a href="#/app/profile" class="act-set" aria-label="${t('profile.settings')}" title="${t('profile.settings')}">⚙️</a>
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

  // ————— Stories : files de ceux que je suis + ma propre storie —————
  // s.stories : [{ id, by, img, ts, caption }] — visibles 24 h
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
          : `<span class="sb-plus">＋</span>`}
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

  // Visionneuse plein écran façon Instagram : progression, tap gauche/droite, auto-close
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
          <button class="sv-close" aria-label="${t('common.close')}">✕</button>
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

  // ————— Bouton + : storie (24 h) / post / à la une —————
  function createSheet(kind) {
    const labels = { story: 'activity.addStory', post: 'activity.addPost', feature: 'activity.addFeature' };
    const hints = { story: 'activity.addStoryHint', post: 'activity.addPostHint', feature: 'activity.addFeatureHint' };
    const icons = { story: '⭕', post: '📣', feature: '⭐' };
    const close = sheet(`
      <h2 class="t-h3">${t('activity.addLabel')}</h2>
      <div class="stack-list mt-16">
        ${['story', 'post', 'feature'].map(k => `
        <button class="perm-row as-btn" data-k="${k}">
          <strong>${icons[k]} ${t(labels[k])}</strong>
          <span class="t-small">${t(hints[k])}</span>
        </button>`).join('')}
      </div>`);
    const sc = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    sc().querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      close();
      if (k === 'story') storyComposer();
      if (k === 'post') nav('publish');
      if (k === 'feature') nav('publish', '', 'feature');
    }));
  }

  // Composeur de storie : photo + légende, expire dans 24 h
  function storyComposer() {
    let imgData = null;
    const close = sheet(`
      <h2 class="t-h3">${t('activity.storyNew')}</h2>
      <div class="pub-cover" id="stCover" tabindex="0" role="button" aria-label="${t('activity.storyPick')}">
        <span class="pc-empty">📷<br>${t('activity.storyPick')}</span>
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

  // Mes stories actuelles (gestion : voir / supprimer)
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
            <button class="btn btn-sm btn-ghost danger" data-del="${st.id}">🗑️</button>
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
      case 'friend': return t('activity.notifFriend', { name });
      default: return '';
    }
  }

  function renderNotifs() {
    if (!s.notifs.length) { body.innerHTML = `<div class="state-box card"><p class="t-body">${t('activity.notifEmpty')}</p></div>`; return; }
    body.innerHTML = `
      <div class="flex jc-b ai-c mb-16"><span class="t-small">${s.notifs.length}</span>
      <button class="link-btn" id="markRead">${t('activity.notifMarkRead')}</button></div>
      <div class="stack-list">
      ${s.notifs.map((n, i) => `
        <div class="notif-item card ${n.read ? '' : 'unread'}">
          ${avatarHTML(userById(n.user))}
          <div class="ni-body"><span>${notifText(n)}</span><span class="t-small">${relTime(Date.now() - n.ago * 3600e3)} · · ·</span></div>
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
          <button class="icon-btn" id="convReport" aria-label="${t('activity.msgReport')}" title="${t('activity.msgReport')}">⚠️</button>
          <button class="icon-btn" id="convBlock" aria-label="${t('activity.msgBlock')}" title="${t('activity.msgBlock')}">🚫</button>
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
        <button class="btn btn-primary btn-sm" id="msgSend">${t('common.send')}</button>
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
      // réponse simulée
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
  // point rouge qui pulse une fois à l'arrivée si non lues
  if (tab === 'notif' && s.notifs.some(n => !n.read)) setTimeout(() => root.querySelector('.notif-dot.pulse')?.classList.remove('pulse'), 950);
  renderTab();
}

// ———————————————————— Profil ————————————————————
export function renderProfile(root, nav) {
  const s = state();
  const me = s.user;
  const myPosts = s.events.filter(e => e.organizer === 'me' && e.status !== 'removed');
  const drafts = s.events.filter(e => e.organizer === 'me' && e.status === 'draft');
  const scheduled = s.events.filter(e => e.organizer === 'me' && e.status === 'scheduled');

  root.innerHTML = `
  <div class="prof-page">
    <div class="prof-head card">
      <div class="ph-top">
        ${me?.photo
          ? `<span class="prof-avatar has-photo"><img src="${me.photo}" alt=""></span>`
          : `<span class="prof-avatar" style="background:${me?.color || '#9B1C28'}">${(me?.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('')}</span>`}
        <div class="prof-stats">
          <div><strong>${myPosts.filter(e => e.status === 'ok').length}</strong><span>${t('profile.posts')}</span></div>
          <div><strong>${(me?.followers || 0).toLocaleString()}</strong><span>${t('profile.followers')}</span></div>
          <div><strong>${(me?.following || 0).toLocaleString()}</strong><span>${t('profile.following')}</span></div>
        </div>
      </div>
      <h1 class="prof-name">${me?.name} ${me?.verified ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="${t('common.verified')}"><circle cx="12" cy="12" r="10" fill="#2E7D5B"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</h1>
      <span class="t-small">@${me?.username}</span>
      ${me?.bio && tx(me.bio) ? `<p class="t-body mt-8">${tx(me.bio)}</p>` : ''}
      <div class="flex gap-8 wrap mt-16">
        <button class="btn btn-primary btn-sm" id="pAdd">＋ ${t('profile.addPost')}</button>
        <button class="btn btn-ghost btn-sm" id="pEdit">${t('profile.editProfile')}</button>
        <button class="btn btn-ghost btn-sm" id="pSet">⚙️ ${t('profile.settings')}</button>
      </div>
    </div>

    ${drafts.length ? `
    <h2 class="t-h3 mt-24">${t('publish.drafts')} (${drafts.length})</h2>
    <div class="stack-list mt-8">${drafts.map(e => draftRow(e)).join('')}</div>` : ''}
    ${scheduled.length ? `
    <h2 class="t-h3 mt-24">${t('publish.scheduled')} (${scheduled.length})</h2>
    <div class="stack-list mt-8">${scheduled.map(e => draftRow(e)).join('')}</div>` : ''}

    <h2 class="t-h3 mt-24">${t('publish.published')}</h2>
    ${myPosts.filter(e => e.status === 'ok').length ? `
    <div class="prof-grid mt-8">
      ${myPosts.filter(e => e.status === 'ok').map(e => `
      <div class="pg-item" data-ev="${e.id}">
        <img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="${tx(e.title)}" loading="lazy" class="img-prog" onload="this.classList.add('loaded')">
        <div class="pg-over"><span>🔥 ${hypeScore(e).toLocaleString()}</span><span>${e.price?.on ? e.price.amount + ' ' + e.price.cur : t('common.free')}</span></div>
        <div class="pg-menu">
          <button class="icon-btn" data-edit="${e.id}" aria-label="${t('common.edit')}">✏️</button>
          <button class="icon-btn" data-del="${e.id}" aria-label="${t('common.delete')}">🗑️</button>
        </div>
      </div>`).join('')}
    </div>` : `<div class="state-box card mt-8"><p class="t-body">${t('profile.emptyGrid')}</p>
      <button class="btn btn-primary btn-sm mt-12" id="gAdd">＋ ${t('profile.addPost')}</button></div>`}
  </div>`;

  const $ = (q) => root.querySelector(q);
  const goPublish = () => nav('publish');
  $('#pAdd')?.addEventListener('click', goPublish);
  $('#gAdd')?.addEventListener('click', goPublish);
  $('#pEdit').addEventListener('click', editProfile);
  $('#pSet').addEventListener('click', settingsSheet);

  root.querySelectorAll('[data-ev]').forEach(el => el.addEventListener('click', e => {
    if (e.target.closest('[data-edit]') || e.target.closest('[data-del]')) return;
    import('./feed.js').then(m => m.openDetail(el.dataset.ev, nav));
  }));
  root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => nav('publish', b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deletePostFlow(b.dataset.del, nav)));
  root.querySelectorAll('[data-cont]').forEach(b => b.addEventListener('click', () => {
    const e = ev(b.dataset.cont);
    if (e) { e.status = 'ok'; e.ts = Date.now(); save(); toast(t('publish.publishedToast'), 'ok'); renderProfile(root, nav); }
  }));

  function draftRow(e) {
    return `
      <div class="mine-item card">
      <div class="mi-media">${e.img ? `<img src="${e.img.startsWith('data:') ? e.img : IMG('w-poster-' + e.img)}" alt="">` : '<div class="pc-empty small">🖼️</div>'}</div>
      <div class="mi-body">
        <strong>${e.title || t('publish.titlePlaceholder')}</strong>
        <span class="t-small">${e.status === 'scheduled' ? '⏰ ' + fmtDate(e.scheduledFor) + ' · ' + fmtTime(e.scheduledFor) : '📝 ' + t('publish.drafts')}</span>
        <div class="mi-actions">
          <button class="btn btn-sm btn-ghost" data-edit="${e.id}">✏️ ${t('common.edit')}</button>
          ${e.status === 'scheduled' || e.status === 'draft' ? `<button class="btn btn-sm btn-primary" data-cont="${e.id}">${t('publish.publish')}</button>` : ''}
          <button class="btn btn-sm btn-ghost danger" data-del="${e.id}">🗑️</button>
        </div>
      </div>
    </div>`;
  }

  function editProfile() {
    const close = sheet(`
      <h2 class="t-h3">${t('profile.editTitle')}</h2>
      <div class="field mt-16"><label>${t('profile.photoLabel')}</label>
        <div class="flex gap-12 ai-c">
          <span class="prof-avatar" id="epAv" style="background:${me.color}">${me.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
          <button class="btn btn-ghost btn-sm" id="epPhoto">${t('profile.photoButton')}</button>
          <input type="color" id="epColor" value="${me.color}" aria-label="${t('profile.photoLabel')}" style="width:44px;height:44px;border:0;background:none;border-radius:50%">
        </div></div>
      <div class="field"><label for="ep-name">${t('auth.name')}</label><input id="ep-name" value="${me.name}"></div>
      <div class="field"><label for="ep-bio">${t('profile.bioLabel')}</label><textarea id="ep-bio" placeholder="${t('profile.bioPlaceholder')}">${tx(me.bio) || ''}</textarea></div>
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
      save(); close(); toast(t('profile.savedToast'), 'ok'); renderProfile(root, nav);
    });
  }

  function settingsSheet() {
    const close = sheet(`
      <h2 class="t-h3">⚙️ ${t('profile.settings')}</h2>

      <div class="set-group mt-16">
        <div class="perm-row"><strong>🌐 ${t('profile.setLanguage')}</strong>
          <div class="lang-menu" id="langSet"></div></div>
      </div>

      <div class="set-group">
        <div class="set-title">${t('profile.setNotifications')}</div>
        ${['notifLikes', 'notifFollows', 'notifReminders'].map(k => `
        <div class="perm-row"><strong>${t('profile.set' + k[0].toUpperCase() + k.slice(1))}</strong>
          <label class="switch"><input type="checkbox" data-set="${k}" ${s.settings[k] ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>`).join('')}
      </div>

      <div class="set-group">
        <div class="set-title">${t('profile.setPrivacy')}</div>
        <div class="perm-row"><strong>${t('profile.setPrivateLikes')}</strong>
          <label class="switch"><input type="checkbox" data-set="privateLikes" ${s.settings.privateLikes ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
        <button class="perm-row as-btn" id="setBlocked"><strong>🚫 ${t('profile.setBlocked')}</strong><span>›</span></button>
      </div>

      <button class="perm-row as-btn danger w100" id="setLogout"><strong>${t('profile.logout')}</strong><span>›</span></button>
      <button class="perm-row as-btn danger w100" id="setDelete"><strong>${t('profile.setDeleteAccount')}</strong><span>›</span></button>
      <p class="t-small center mt-16">CongoFlow v1 · ${t('states.demoAccount')}</p>`);

    // IMPORTANT : chercher les éléments DANS cette sheet (une ancienne sheet peut
    // encore exister 450 ms dans le DOM avec les mêmes ids)
    const scope = () => [...document.querySelectorAll('.sheet-backdrop')].pop() || document;
    scope().querySelectorAll('[data-set]').forEach(sw => sw.addEventListener('change', function () {
      s.settings[this.dataset.set] = this.checked; save();
    }));
    renderLangPicker(scope().querySelector('.lang-menu'), () => { close(); renderProfile(root, nav); router(); });
    scope().querySelector('#setBlocked').addEventListener('click', () => {
      const c2 = sheet(`<h2 class="t-h3">🚫 ${t('profile.setBlocked')}</h2>
        ${s.blocked.length ? s.blocked.map(b => `<div class="perm-row"><strong>${userById(b)?.name || b}</strong><button class="btn btn-ghost btn-sm" data-un="${b}">${t('profile.unblock')}</button></div>`).join('') : `<p class="t-body mt-16">${t('profile.blockedEmpty')}</p>`}`);
      [...document.querySelectorAll('.sheet-backdrop')].pop().querySelectorAll('[data-un]').forEach(btn => btn.addEventListener('click', () => {
        s.blocked = s.blocked.filter(x => x !== btn.dataset.un); save();
        toast(t('profile.unblocked'), 'ok'); c2(); close(); settingsSheet();
      }));
    });

    scope().querySelector('#setLogout').addEventListener('click', () => {
      const c2 = sheet(`<h2 class="t-h3">${t('profile.logout')}</h2><p class="t-body mt-8">${t('profile.logoutConfirm')}</p>
        <div class="flex gap-12 mt-16"><button class="btn btn-ghost" style="flex:1" id="loNo">${t('common.cancel')}</button><button class="btn btn-primary" style="flex:1" id="loYes">${t('profile.logout')}</button></div>`);
      document.getElementById('loNo').addEventListener('click', c2);
      document.getElementById('loYes').addEventListener('click', () => { s.user = null; save(); c2(); close(); location.hash = '#/'; });
    });

    scope().querySelector('#setDelete').addEventListener('click', () => {
      const c2 = sheet(`<h2 class="t-h3" style="color:var(--err)">${t('profile.setDeleteAccount')}</h2><p class="t-body mt-8">${t('profile.deleteAccountConfirm')}</p>
        <div class="flex gap-12 mt-16"><button class="btn btn-ghost" style="flex:1" id="daNo">${t('common.cancel')}</button><button class="btn btn-primary" style="flex:1;background:var(--err)" id="daYes">${t('common.delete')}</button></div>`);
      document.getElementById('daNo').addEventListener('click', c2);
      document.getElementById('daYes').addEventListener('click', () => {
        localStorage.removeItem('congoflow_v1'); c2(); close();
        toast(t('profile.deleteAccountDone'));
        setTimeout(() => location.hash = '#/', 400);
      });
    });
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
