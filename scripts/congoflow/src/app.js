// CongoFlow — App shell : routeur, en-tête, navigation, états globaux, PWA
import { t, tx, state, save, load, detectLang, ensureDemoEvents, setLang, avatarHTML } from './core.js';
import { renderLanding, LOGO_RED, legalPage } from './landing.js';
import { renderAuth, renderOnboarding } from './auth.js';
import { renderFeed, renderEventPage, ILLU } from './feed.js';
import { renderPublish } from './publish.js';
import { renderMine, renderActivity, renderProfile, renderLangPicker } from './pages.js';
import { renderSearch, renderTag } from './search.js';

const $app = () => document.getElementById('app');
let cleanupFn = null;

function nav(view, arg) {
  const map = { feed: '#/app/feed', mine: '#/app/mine', publish: '#/app/publish', activity: '#/app/activity', profile: '#/app/profile', onboarding: '#/onboarding' };
  if (view === 'activity' && arg === 'messages') { location.hash = '#/app/activity'; sessionStorage.setItem('cf_tab', 'msg'); }
  else if (view === 'publish' && arg) location.hash = '#/app/publish/' + arg;
  else location.hash = map[view] || '#/app/feed';
}

export function router() {
  if (cleanupFn) { try { cleanupFn(); } catch (e) {} cleanupFn = null; }
  const hash = location.hash || '#/';
  const app = $app();
  window.scrollTo(0, 0);
  const s = state();

  // ——— Ancres internes de la landing (Fonctionnalités / FAQ) ———
  // Le routeur hash les intercepte : on rend la landing si besoin puis on scrolle
  // en douceur vers la section, avec la compensation de la barre de navigation fixe.
  if (hash.startsWith('#/') === false && hash.length > 1) {
    const targetId = hash.slice(1); // features | faq | hero…
    const isLanding = !!document.querySelector('#landing');
    if (!isLanding) { cleanupFn = renderLanding(app, { nav }); }
    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 84; // hauteur nav + marge
        window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    });
    return;
  }

  // ——— Routes publiques ———
  if (hash === '#/' || hash === '') {
    cleanupFn = renderLanding(app, { nav });
    afterRender('landing');
    return;
  }
  if (hash.startsWith('#/legal/')) {
    const kind = hash.split('/')[2];
    app.innerHTML = legalPage(kind);
    afterRender('legal');
    return;
  }
  if (hash.startsWith('#/auth')) {
    if (s.user) return nav('feed');
    cleanupFn = renderAuth(app, nav);
    afterRender('auth');
    return;
  }
  if (hash.startsWith('#/onboarding')) {
    if (!s.user) return location.hash = '#/auth';
    renderOnboarding(app, nav);
    afterRender('onboarding');
    return;
  }

  // ——— App (connexion requise) ———
  if (hash.startsWith('#/app') || hash.startsWith('#/tag/') || hash.startsWith('#/ev/')) {
    if (!s.user) return location.hash = '#/auth';
    const sub = hash.startsWith('#/tag/') ? '/tag/' + hash.split('/')[2]
      : hash.startsWith('#/ev/') ? '/ev/' + hash.split('/')[2]
      : (hash.replace('#/app', '') || '/feed');
    const parts = sub.split('/').filter(Boolean);
    const view = parts[0] || 'feed';

    let inner = null, title = '';
    const main = document.createElement('div');
    main.className = 'app-main';
    app.innerHTML = '';
    app.appendChild(main);

    switch (view) {
      case 'feed': inner = () => renderFeed(main, nav); title = t('nav.home'); break;
      case 'mine': inner = () => renderMine(main, nav); title = t('nav.mine'); break;
      case 'publish': inner = () => renderPublish(main, nav, parts[1]); title = t('nav.publish'); break;
      case 'activity': inner = () => renderActivity(main, nav, sessionStorage.getItem('cf_tab') === 'msg' ? 'msg' : 'notif'); sessionStorage.removeItem('cf_tab'); break;
      case 'profile': inner = () => renderProfile(main, nav); title = t('nav.profile'); break;
      case 'search': inner = () => renderSearch(main, nav); title = t('common.search'); break;
      case 'tag': inner = () => renderTag(main, nav, parts[1] || ''); break;
      case 'ev': inner = () => { renderEventPage(main, nav, parts[1] || ''); }; break;
      default:
        app.innerHTML = `
        <div class="notfound">
          <div class="state-illu card-drop">${ILLU.notfound()}</div>
          <h1 class="t-h2">${t('states.pageNotFound')}</h1>
          <p class="t-body">${t('states.pageNotFoundText')}</p>
          <button class="btn btn-primary mt-16" onclick="location.hash='#/'">${t('states.backHome')}</button>
        </div>`;
        afterRender('404');
        return;
    }
    cleanupFn = inner();
    renderShell(title);
    return;
  }

  // ——— 404 ———
  app.innerHTML = `
  <div class="notfound">
    <div class="state-illu card-drop">${ILLU.notfound()}</div>
    <h1 class="t-h2">${t('states.pageNotFound')}</h1>
    <p class="t-body">${t('states.pageNotFoundText')}</p>
    <button class="btn btn-primary mt-16" onclick="location.hash='#/'">${t('states.backHome')}</button>
  </div>`;
  afterRender('404');
}

// ——— En-tête + barre de navigation de l'app ———
function renderShell() {
  const s = state();
  const old = document.getElementById('appHeader'), oldb = document.getElementById('appNav');
  old?.remove(); oldb?.remove();

  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'appHeader';
  header.innerHTML = `
    <a href="#/app/feed" class="ah-logo" aria-label="CongoFlow">${LOGO_RED}</a>
    <div class="flex ai-c gap-8" style="margin-left:auto">
      <div class="lang-menu" id="langApp"></div>
      <a href="#/app/profile" class="ah-me" aria-label="${t('nav.profile')}">${avatarHTML(s.user)}</a>
    </div>`;
  document.body.prepend(header);

  const bar = document.createElement('nav');
  bar.className = 'app-nav';
  bar.id = 'appNav';
  bar.setAttribute('aria-label', t('common.appName'));
  const cur = ((location.hash.startsWith('#/tag/') ? 'search' : location.hash.startsWith('#/ev/') ? 'feed' : (location.hash.replace('#/app', '') || '/feed')).split('/')[1]) || 'feed';
  const items = [
    ['feed', t('nav.home'), 'M3 10.5L12 3l9 7.5V21h-6v-6h-6v6H3z'],
    ['mine', t('nav.mine'), 'M4 5h16v2H4zM4 10h10v2H4zM4 15h13v2H4z'],
    ['__add', '', ''],
    ['activity', t('nav.activity'), 'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0'],
    ['profile', t('nav.profile'), 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  ];
  bar.innerHTML = items.map(([id, label, d]) => {
    if (id === '__add') return `<a href="#/app/publish" class="an-add" aria-label="${t('nav.publish')}"><span>＋</span></a>`;
    const on = cur === id || (id === 'feed' && cur === 'ev');
    return `<a href="#/app/${id}" class="an-item ${on ? 'on' : ''}" aria-current="${on ? 'page' : 'false'}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${label}</span>
      ${id === 'activity' && s.notifs.some(n => !n.read) ? '<span class="notif-dot"></span>' : ''}
    </a>`;
  }).join('');
  document.body.appendChild(bar);

  renderLangPicker(header.querySelector('#langApp'), () => router());
}

// ————— Après chaque rendu : observer reveals, etc. —————
function afterRender(kind) {
  document.getElementById('appHeader')?.remove();
  document.getElementById('appNav')?.remove();
}

// ————— Toast global —————
let toastT;
window.toast = function (msg, type = '') {
  let el = document.getElementById('cfToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cfToast'; el.className = 'toast'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2600);
};

// ————— Fond : grille de points interactive — UNIQUEMENT sur la landing (zone hero) —————
function initDots() {
  const cv = document.createElement('canvas');
  cv.className = 'dots-bg';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W, H, dots = [], mouse = { x: -999, y: -999 };
  const GAP = 26, R = 1.4;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // le canvas suit la section hero de la landing (s'il y en a une)
  const heroEl = () => document.querySelector('#hero');

  function resize() {
    const hero = heroEl();
    if (!hero) { cv.style.display = 'none'; return; }
    cv.style.display = '';
    const r = hero.getBoundingClientRect();
    W = cv.width = Math.ceil(r.width);
    H = cv.height = Math.ceil(Math.max(r.height, window.innerHeight * .9));
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    dots = [];
    for (let y = GAP / 2; y < H; y += GAP) for (let x = GAP / 2; x < W; x += GAP) dots.push({ x, y });
  }
  function place() {
    // positionne le canvas sur le hero (absolu par rapport à la page)
    const hero = heroEl();
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    cv.style.position = 'absolute';
    cv.style.left = Math.round(r.left + window.scrollX) + 'px';
    cv.style.top = Math.round(r.top + window.scrollY) + 'px';
    cv.style.zIndex = '0';
  }
  let rafOn = true;
  function draw() {
    if (!heroEl()) { rafOn = false; return; }   // hors landing : stoppe la boucle
    ctx.clearRect(0, 0, W, H);
    const hot = !reduce;
    for (const d of dots) {
      let r = R, c = '218,213,204';
      if (hot) {
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        if (dist < 130) {
          const k = 1 - dist / 130;
          r = R + k * 1.7; c = '155,28,40';
          ctx.globalAlpha = .18 + k * .55;
        } else { ctx.globalAlpha = 1; }
      }
      ctx.fillStyle = `rgba(${c},1)`;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  const watch = () => { place(); resize(); };
  addEventListener('resize', watch, { passive: true });
  addEventListener('hashchange', () => setTimeout(watch, 60));
  addEventListener('scroll', () => place(), { passive: true });
  addEventListener('pointermove', e => {
    const cvr = cv.getBoundingClientRect();
    mouse.x = e.clientX - cvr.left; mouse.y = e.clientY - cvr.top;
  }, { passive: true });
  addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999; });
  watch();
  draw();
  // redémarre la boucle si on revient sur la landing
  setInterval(() => { if (heroEl() && !rafOn) { rafOn = true; watch(); draw(); } }, 800);
}

// ————— Bandeau réseau —————
function initNetwork() {
  const el = document.createElement('div');
  el.className = 'netbanner';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="nb-dot"></span><span id="nbTxt"></span>`;
  document.body.appendChild(el);
  const show = (off) => {
    el.classList.toggle('show', off);
    el.classList.toggle('ok', !off);
    el.querySelector('.nb-dot').style.background = off ? '' : 'var(--bg)';
    el.querySelector('#nbTxt').textContent = off ? '⚠︎ ' + t('states.offlineTitle') : '✓ ' + t('states.backOnline');
    if (!off) setTimeout(() => el.classList.remove('show'), 2600);
  };
  addEventListener('offline', () => show(true));
  addEventListener('online', () => show(false));
  if (!navigator.onLine) setTimeout(() => show(true), 800);
}

// ————— PWA : manifeste inline + service worker minimal + bouton installer —————
function initPWA() {
  // manifest en blob (application installable sans fichier séparé)
  const manifest = {
    name: 'CongoFlow', short_name: 'CongoFlow', start_url: '.', display: 'standalone',
    background_color: '#F7F4EF', theme_color: '#9B1C28', lang: 'fr',
    description: 'Découvre, aime et publie des événements à Kinshasa.',
    icons: [{ src: CF_IMG['icon-192'] || '', sizes: '192x192', type: 'image/png' }, { src: CF_IMG['icon-512'] || '', sizes: '512x512', type: 'image/png' }]
  };
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/json' }));
  document.head.appendChild(link);

  // Événements aimés consultables hors connexion : ils sont déjà dans localStorage,
  // on affiche une note la première fois que l'app est chargée hors ligne.
  let tip = document.createElement('div');
  tip.className = 'pwa-tip hidden';
  document.body.appendChild(tip);

  // Bouton d'installation (avantinstallprompt)
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    tip.classList.remove('hidden');
    tip.innerHTML = `<div class="install-tip">
      <span class="so-ico" style="background:var(--red)">📥</span>
      <div style="flex:1"><strong class="small">${t('pwa.installTitle')}</strong><br><span class="t-small">${t('pwa.installText')}</span></div>
      <button class="btn btn-primary btn-sm" id="pwaYes">${t('pwa.installBtn')}</button>
      <button class="icon-btn" id="pwaNo" aria-label="${t('pwa.later')}">✕</button>
    </div>`;
    tip.querySelector('#pwaYes').addEventListener('click', async () => { deferred?.prompt(); deferred = null; tip.classList.add('hidden'); });
    tip.querySelector('#pwaNo').addEventListener('click', () => tip.classList.add('hidden'));
  });
  // Rappel offline-ready après le premier like
  addEventListener('storage', () => {});
}

// ————— Démarrage —————
export function boot() {
  load();
  detectLang();
  document.documentElement.lang = state().lang;
  ensureDemoEvents();

  // splash : logo en fondu avec pulsation douce
  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.innerHTML = `<div class="splash-logo">${LOGO_RED.replace('width="150" height="24"', 'width="220" height="34"')}</div>`;
  document.body.appendChild(splash);
  setTimeout(() => splash.classList.add('hide'), 700);
  setTimeout(() => splash.remove(), 1250);

  initDots();
  initNetwork();
  initPWA();
  addEventListener('hashchange', router);
  router();
}
