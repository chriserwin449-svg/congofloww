// CongoFlow — Publier : parcours en 4 étapes (+ édition / suppression)
import { t, tx, state, save, ev, uid, hypeScore, hypeLevel, fmtPrice, IMG, icon, CITIES } from './core.js';
import { sheet } from './feed.js';
import { demoHashtagPool, AREAS } from './data/demo.js';

const CATS = () => Object.keys(t('feed.categories')).filter(c => c !== 'all');

// data : brouillon courant (ou édition d'un post existant)
export function renderPublish(root, nav, editId) {
  const s = state();
  const editing = editId ? ev(editId) : null;
  let data = editing ? JSON.parse(JSON.stringify(editing)) : {
    id: uid('mev'), img: '', category: 'party', price: { on: false, amount: '', cur: 'USD' },
    allowComments: true, showLikes: true, allowMessages: true,
    title: '', sub: '', desc: '', program: '', practical: '',
    date: '', time: '', city: s.user.city || 'Kinshasa', commune: (AREAS[s.user.city] || AREAS['Kinshasa'])[0], area: '', addr: '',
    hashtags: [], status: 'draft', organizer: s.user.id,
  };
  // édition : la date est stockée en ISO complet (« 2026-12-02T19:30 ») ;
  // re-découper en date + heure pour les champs du formulaire
  if (editing && data.date && String(data.date).includes('T')) {
    const [dPart, tPart] = String(data.date).split('T');
    data.date = dPart;
    if (!data.time) data.time = (tPart || '').slice(0, 5);
  }
  let step = 0;

  root.innerHTML = `
  <div class="pub-page">
    <div class="pub-head">
      <button class="pub-close" id="pubClose" aria-label="${t('common.close')}">${icon('close', 18)}</button>
      <h1 class="pub-title">${editing ? t('publish.editTitle') : t('nav.publish')}</h1>
      <span class="pub-step t-small">${t('publish.step')} ${step + 1}/4</span>
    </div>
    <div class="pub-progress"><span id="pubBar" style="width:25%"></span></div>
    <div class="pub-card" id="pubCard"></div>
    <div class="pub-nav">
      <button class="btn btn-ghost" id="pubPrev" ${step === 0 ? 'disabled' : ''}>${t('common.back')}</button>
      <button class="btn btn-primary" id="pubNext">${step < 3 ? t('common.next') : t('publish.publish')}</button>
    </div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const card = $('#pubCard');

  const setStep = (i) => {
    step = Math.max(0, Math.min(3, i));
    $('#pubBar').style.width = (step + 1) * 25 + '%';
    $('.pub-step').textContent = `${t('publish.step')} ${step + 1}/4`;
    $('#pubPrev').disabled = step === 0;
    $('#pubNext').textContent = step < 3 ? t('common.next') : t('publish.publish');
    card.classList.remove('step-in'); void card.offsetWidth; card.classList.add('step-in');
    [renderS1, renderS2, renderS3, renderS4][step]();
    card.querySelector('input, textarea, select, button')?.focus?.();
  };

  const bind = (sel, key, prop = 'value') => {
    const el = card.querySelector(sel);
    if (el) el.addEventListener('input', () => { data[key] = el[prop]; });
  };

  // ————— Étape 1 : Identifier —————
  function renderS1() {
    const communes = AREAS[data.city] || AREAS['Kinshasa'];
    if (!communes.includes(data.commune)) data.commune = communes[0];
    card.innerHTML = `
      <h2 class="t-h2 pub-h">${t('publish.s1Title')}</h2>
      <div class="pub-cover ${data.img ? 'has' : ''}" id="pubCover" tabindex="0" role="button" aria-label="${t('publish.coverButton')}">
        ${data.img ? `<img src="${data.img}" alt="">` : `<span class="pc-empty">${icon('camera', 26)}<br>${t('publish.coverButton')}<small>${t('publish.coverHint')}</small></span>`}
      </div>
      <div class="field mt-16"><label for="p-title">${t('publish.title')} *</label>
        <input id="p-title" value="${(data.title || '').replace(/"/g, '&quot;')}" placeholder="${t('publish.titlePlaceholder')}" maxlength="80"><p class="field-msg"></p></div>
      <div class="field"><label for="p-cat">${t('publish.category')}</label>
        <select id="p-cat">${CATS().map(c => `<option value="${c}" ${data.category === c ? 'selected' : ''}>${t('feed.categories')[c]}</option>`).join('')}</select></div>
      <div class="two-cols">
        <div class="field"><label for="p-date">${t('publish.date')} *</label><input id="p-date" type="date" value="${data.date}"><p class="field-msg"></p></div>
        <div class="field"><label for="p-time">${t('publish.time')} *</label><input id="p-time" type="time" value="${data.time}"><p class="field-msg"></p></div>
      </div>
      <div class="two-cols">
        <div class="field"><label for="p-city">${t('publish.city')} *</label>
          <select id="p-city">${CITIES.map(c => `<option ${c.name === data.city ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
        <div class="field"><label for="p-com">${t('publish.commune')} *</label>
          <select id="p-com">${communes.map(c => `<option ${data.commune === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="p-addr">${t('publish.address')}</label><input id="p-addr" value="${(data.addr || '').replace(/"/g, '&quot;')}" placeholder="${t('publish.address')}…"></div>`;

    bind('#p-title', 'title'); bind('#p-cat', 'category'); bind('#p-date', 'date'); bind('#p-time', 'time');
    bind('#p-city', 'city'); bind('#p-com', 'commune'); bind('#p-addr', 'addr');
    // le changement de ville met à jour les communes
    card.querySelector('#p-city').addEventListener('change', (e) => {
      data.city = e.target.value;
      const cs = AREAS[data.city] || AREAS['Kinshasa'];
      data.commune = cs[0];
      card.querySelector('#p-com').innerHTML = cs.map(c => `<option>${c}</option>`).join('');
    });
    card.querySelector('#pubCover').addEventListener('click', pickCover);
    card.querySelector('#pubCover').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCover(); } });
  }

  // Choix d'image + recadrage 4:5
  function pickCover() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', () => {
      const f = input.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => cropSheet(rd.result);
      rd.readAsDataURL(f);
    });
    input.click();
  }

  function cropSheet(src) {
    const close = sheet(`
      <h2 class="t-h3 center">${t('publish.cropTitle')}</h2>
      <p class="t-small center mt-8">${t('publish.cropHint')}</p>
      <div class="crop-zone" id="cropZone">
        <img id="cropImg" src="${src}" alt="">
        <div class="crop-frame" id="cropFrame"></div>
      </div>
      <button class="btn btn-primary btn-block btn-lg mt-16" id="cropOk">${t('publish.cropApply')}</button>`);
    const zone = [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#cropZone');
    const im = [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#cropImg');
    let ox = 0, oy = 0, drag = null;
    im.onload = fit;
    function fit() {
      const zw = zone.clientWidth, zh = zone.clientHeight;
      const base = Math.max(zw / im.naturalWidth, zh / im.naturalHeight);
      const sc = base * parseFloat(im.dataset.z || 1);
      im.style.width = im.naturalWidth * sc + 'px';
      im.style.height = im.naturalHeight * sc + 'px';
      clamp(); apply();
    }
    function clamp() {
      const zw = zone.clientWidth, zh = zone.clientHeight;
      ox = Math.min(0, Math.max(zw - im.width, ox));
      oy = Math.min(0, Math.max(zh - im.height, oy));
    }
    function apply() { im.style.transform = `translate(${ox}px,${oy}px)`; }
    im.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox, oy }; im.setPointerCapture(e.pointerId); });
    im.addEventListener('pointermove', e => { if (!drag) return; ox = drag.ox + (e.clientX - drag.x); oy = drag.oy + (e.clientY - drag.y); clamp(); apply(); });
    im.addEventListener('pointerup', () => drag = null);
    [...document.querySelectorAll('.sheet-backdrop')].pop().querySelector('#cropOk').addEventListener('click', () => {
      const zw = zone.clientWidth, zh = zone.clientHeight;
      const cv = document.createElement('canvas');
      cv.width = 750; cv.height = 937; // 4:5
      const cx = cv.getContext('2d');
      cx.fillStyle = '#0E0E10'; cx.fillRect(0, 0, 750, 937);
      const k = 750 / zw;
      cx.drawImage(im, -ox * k, -oy * k, im.width * k, im.height * k);
      data.img = cv.toDataURL('image/jpeg', .82);
      close();
      setStep(0);
      toast('✓ ' + t('publish.coverLabel'));
    });
    fit();
  }

  // ————— Étape 2 : Décrire —————
  function renderS2() {
    card.innerHTML = `
      <h2 class="t-h2 pub-h">${t('publish.s2Title')}</h2>
      <div class="field"><label for="p-desc">${t('publish.description')} *</label>
        <textarea id="p-desc" placeholder="${t('publish.descriptionPlaceholder')}">${data.desc}</textarea><p class="field-msg"></p></div>
      <div class="field"><label for="p-prog">${t('publish.program')}</label>
        <textarea id="p-prog" placeholder="${t('publish.programPlaceholder')}">${data.program}</textarea></div>
      <div class="field"><label for="p-pract">${t('publish.practical')}</label>
        <textarea id="p-pract" placeholder="${t('publish.practicalPlaceholder')}">${data.practical}</textarea></div>`;
    bind('#p-desc', 'desc'); bind('#p-prog', 'program'); bind('#p-pract', 'practical');
  }

  // ————— Étape 3 : Autorisations —————
  function renderS3() {
    card.innerHTML = `
      <h2 class="t-h2 pub-h">${t('publish.s3Title')}</h2>

      <div class="perm-row">
        <div><strong>${t('publish.priceToggle')}</strong><p class="t-small" id="priceHint">${data.price.on ? t('publish.priceSet', { amount: data.price.amount, currency: data.price.cur }) : t('publish.priceFree')}</p></div>
        <label class="switch"><input type="checkbox" id="sw-price" ${data.price.on ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label>
      </div>
      <div class="price-fields ${data.price.on ? '' : 'hidden'}" id="priceFields">
        <input type="number" min="0" id="p-amount" placeholder="${t('publish.priceAmount')}" value="${data.price.amount}">
        <select id="p-cur"><option ${data.price.cur === 'USD' ? 'selected' : ''}>USD</option><option ${data.price.cur === 'CDF' ? 'selected' : ''}>CDF</option></select>
        <button class="btn btn-dark btn-sm" id="p-ok">${t('publish.priceOk')}</button>
      </div>

      <div class="perm-row"><div><strong>${t('publish.commentsToggle')}</strong><p class="t-small">${data.allowComments ? t('publish.commentsOn') : t('publish.commentsOff')}</p></div>
        <label class="switch"><input type="checkbox" id="sw-com" ${data.allowComments ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="perm-row"><div><strong>${t('publish.likesToggle')}</strong><p class="t-small">${data.showLikes ? t('publish.likesOn') : t('publish.likesOff')}</p></div>
        <label class="switch"><input type="checkbox" id="sw-likes" ${data.showLikes ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="perm-row"><div><strong>${t('publish.messagesToggle')}</strong><p class="t-small">${data.allowMessages ? t('publish.messagesOn') : t('publish.messagesOff')}</p></div>
        <label class="switch"><input type="checkbox" id="sw-msg" ${data.allowMessages ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>`;

    const sw = (id, fn) => card.querySelector(id).addEventListener('change', function () { fn(this.checked); renderS3(); });
    sw('#sw-price', v => data.price.on = v);
    sw('#sw-com', v => data.allowComments = v);
    sw('#sw-likes', v => data.showLikes = v);
    sw('#sw-msg', v => data.allowMessages = v);
    card.querySelector('#p-ok')?.addEventListener('click', () => {
      data.price.amount = card.querySelector('#p-amount').value || '0';
      data.price.cur = card.querySelector('#p-cur').value;
      toast(t('publish.priceSet', { amount: data.price.amount, currency: data.price.cur }), 'ok');
    });
  }

  // ————— Étape 4 : Finaliser —————
  function renderS4() {
    card.innerHTML = `
      <h2 class="t-h2 pub-h">${t('publish.s4Title')}</h2>

      <label class="pub-label">${t('publish.hashtags')} <span class="t-small">· ${t('publish.hashtagsCount', { n: data.hashtags.length })}</span></label>
      <div class="ht-box">
        ${data.hashtags.map(h => `<span class="tag-chip sel">#${h} <button data-rm="${h}" aria-label="✕ ${h}">✕</button></span>`).join('')}
        <input id="p-ht" placeholder="${t('publish.hashtagsPlaceholder')}" ${data.hashtags.length >= 10 ? 'disabled' : ''} autocomplete="off">
      </div>
      <!-- suggestions PENDANT la frappe, sans aucun chiffre -->
      <div class="ht-sugg" id="htSugg"></div>

      <div class="field mt-16"><label for="p-sub">${t('publish.subtitleExtra')} (${t('common.optional')})</label>
        <input id="p-sub" value="${(data.sub || '').replace(/"/g, '&quot;')}" placeholder="${t('publish.subtitleExtraPlaceholder')}"></div>

      <div class="pub-preview">
        <span class="t-small">${t('publish.preview')}</span>
        <div class="ev-card mini" id="prevCard">${miniPreview()}</div>
      </div>

      <div class="pub-final-btns">
        <button class="btn btn-ghost" id="pubDraft">${t('publish.draft')}</button>
        <button class="btn btn-ghost" id="pubSched">${t('publish.schedule')}</button>
      </div>`;

    bind('#p-sub', 'sub');
    const htInput = card.querySelector('#p-ht');
    const suggBox = card.querySelector('#htSugg');

    // suggestions de hashtags à la frappe (sans compteur)
    const renderSugg = () => {
      const raw = (htInput.value || '').trim().replace(/^#/, '').toLowerCase();
      if (!raw) {
        const pool = demoHashtagPool.filter(h => !data.hashtags.includes(h)).slice(0, 6);
        suggBox.innerHTML = `<span class="t-small">${t('publish.hashtagSuggestion')} :</span> ` + pool.map(h => `<button class="tag-chip" data-add="${h}">#${h}</button>`).join('');
      } else {
        const matches = [...new Set([...demoHashtagPool, ...allTags()])]
          .filter(h => h.includes(raw) && !data.hashtags.includes(h)).slice(0, 6);
        suggBox.innerHTML = matches.length
          ? matches.map(h => `<button class="tag-chip" data-add="${h}">#${h}</button>`).join('')
          : `<span class="t-small">${raw ? `#${raw} ↵` : ''}</span>`;
      }
      suggBox.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { addHt(b.dataset.add); htInput.focus(); }));
    };
    const allTags = () => state().events.flatMap(e => e.hashtags || []);
    const addHt = (raw) => {
      const h = raw.trim().replace(/^#/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (h && !data.hashtags.includes(h) && data.hashtags.length < 10) data.hashtags.push(h);
      renderS4();
      card.querySelector('#p-ht')?.focus();
    };
    htInput?.addEventListener('input', renderSugg);
    htInput?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addHt(htInput.value); } });
    renderSugg();
    card.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addHt(b.dataset.add)));
    card.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { data.hashtags = data.hashtags.filter(x => x !== b.dataset.rm); renderS4(); }));

    card.querySelector('#pubDraft').addEventListener('click', () => {
      data.status = 'draft';
      persist(false);
      toast(t('publish.draftSaved'), 'ok');
      nav('profile');
    });
    card.querySelector('#pubSched').addEventListener('click', schedSheet);
  }

  function miniPreview() {
    const me = s.user || { name: '?' };
    const cats = t('feed.categories');
    return `
      <div class="ev-media">${data.img ? `<img src="${data.img}" alt="">` : `<div class="pc-empty small">${icon('camera', 20)}</div>`}</div>
      <div class="ev-body">
        <div class="ev-top"><span class="badge-hype">${icon('flame', 12)} ${hypeScore({ ...data, stats: { views: 0 }, date: data.date ? data.date + 'T' + (data.time || '18:00') : new Date().toISOString(), ts: Date.now() })}</span>
        <span class="ev-price ${data.price.on ? '' : 'free'}">${data.price.on ? fmtPrice({ on: true, amount: data.price.amount || 0, cur: data.price.cur }) : t('common.free')}</span></div>
        <h3 class="ev-title">${data.title || t('publish.titlePlaceholder')}</h3>
        <div class="ev-meta"><span class="ev-org"><span class="ev-avatar" style="background:#9B1C28">${me.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span><span>${me.name}</span></span>
        <span class="mi-meta">${icon('calendar', 12)} ${data.date || '—'} ${data.time || ''}</span>
        <span class="mi-meta">${icon('pin', 12)} ${data.commune || '—'}, ${data.city || ''}</span></div>
        <div class="ev-tags">${data.hashtags.slice(0, 4).map(h => `<span class="tag-chip">#${h}</span>`).join('')}</div>
      </div>`;
  }

  function schedSheet() {
    const close = sheet(`
      <h2 class="t-h3">${t('publish.scheduleTitle')}</h2>
      <p class="t-body mt-8">${t('publish.scheduleHint')}</p>
      <div class="two-cols mt-16">
        <div class="field"><label for="sc-d">${t('publish.scheduleAt')}</label><input id="sc-d" type="date"></div>
        <div class="field"><label for="sc-t">${t('publish.scheduleAtTime')}</label><input id="sc-t" type="time" value="10:00"></div>
      </div>
      <button class="btn btn-primary btn-block btn-lg mt-16" id="scOk">${t('publish.schedule')}</button>`);
    const scScope = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
    scScope().querySelector('#scOk').addEventListener('click', () => {
      const d = scScope().querySelector('#sc-d').value, tm = scScope().querySelector('#sc-t').value;
      if (!d) { scScope().querySelector('#sc-d').closest('.field').classList.add('cf-shake'); return; }
      data.status = 'scheduled'; data.scheduledFor = d + 'T' + tm;
      persist(false);
      close();
      toast(t('publish.scheduledToast', { date: d, time: tm }), 'ok');
      nav('profile');
    });
  }

  // Validation des étapes
  function validate() {
    const errs = [];
    if (step === 0) {
      if (!data.img) errs.push(['#pubCover', t('publish.needCover')]);
      if (!data.title.trim()) errs.push(['#p-title', t('publish.needTitle')]);
      if (!data.date || !data.time) errs.push([data.date ? '#p-time' : '#p-date', t('publish.needDate')]);
      if (!data.city || !data.commune) errs.push(['#p-city', t('publish.needPlace')]);
    }
    if (step === 1 && !data.desc.trim()) errs.push(['#p-desc', t('publish.needDescription')]);
    if (errs.length) {
      const [sel] = errs[0];
      const el = card.querySelector(sel);
      if (el) { el.classList.add('cf-shake'); setTimeout(() => el.classList.remove('cf-shake'), 420); el.focus?.(); }
      toast(t('publish.requiredFields') + ' ' + errs.map(e => e[1]).join(' · '), 'err');
      return false;
    }
    return true;
  }

  function persist(published) {
    data.ts = data.ts || Date.now();
    data.date = data.date + 'T' + (data.time || '18:00');
    data.stats = data.stats || { views: 12, likes: 0, comments: 0, shares: 0, saves: 0, boosts: 0 };
    data.status = published ? 'ok' : data.status;
    if (editing) {
      const i = s.events.findIndex(e => e.id === editing.id);
      if (i >= 0) s.events[i] = data;
    } else {
      s.events.unshift(data);
    }
    s.user.posts = (s.user.posts || 0) + (editing ? 0 : 1);
    save();
  }

  $('#pubPrev').addEventListener('click', () => setStep(step - 1));
  $('#pubNext').addEventListener('click', () => {
    if (!validate()) return;
    if (step < 3) return setStep(step + 1);
    // Publication !
    data.status = 'ok';
    persist(true);
    confetti();
    setTimeout(() => { toast(t('publish.publishedToast'), 'ok'); nav('feed'); }, 350);
  });
  $('#pubClose').addEventListener('click', () => { if (data.title || data.img) { data.status = 'draft'; persist(false); } nav('feed'); });

  setStep(0);
}

// Confettis rouge + blanc cassé
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#9B1C28', '#F7F4EF', '#7A1520', '#DAD5CC'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = p.style.height = (5 + Math.random() * 7) + 'px';
    p.style.background = colors[i % colors.length];
    p.style.animation = `confetti-fall ${1.6 + Math.random() * 1.4}s cubic-bezier(.22,1,.36,1) ${Math.random() * .5}s forwards`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3800);
  }
}

// ————— Suppression d'un post (depuis profil) —————
export function deletePostFlow(id, nav) {
  const close = sheet(`
    <h2 class="t-h3">${t('common.delete')} ?</h2>
    <p class="t-body mt-8">${t('publish.deleteConfirm')}</p>
    <div class="flex gap-12 mt-16">
      <button class="btn btn-ghost" style="flex:1" id="dpNo">${t('common.cancel')}</button>
      <button class="btn btn-primary" style="flex:1;background:var(--err)" id="dpYes">${t('common.delete')}</button>
    </div>`);
  const dpScope = () => [...document.querySelectorAll('.sheet-backdrop')].pop();
  dpScope().querySelector('#dpNo').addEventListener('click', close);
  dpScope().querySelector('#dpYes').addEventListener('click', () => {
    const s = state();
    s.events = s.events.filter(e => e.id !== id);
    s.user.posts = Math.max(0, (s.user.posts || 1) - 1);
    save();
    close();
    toast(t('publish.deletedToast'));
    nav('profile');
  });
}
