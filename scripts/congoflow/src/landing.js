// CongoFlow — Landing page
import { t, state, setLang, IMG } from './core.js';

// Logo officiel (uploadé) : emblème + libellé. Déclinaisons encre / blanc cassé.
const logoHTML = (variant, h = 32) => `
  <span class="logo-lockup" role="img" aria-label="CongoFlow">
    <img src="${IMG('logo-' + variant)}" alt="" class="logo-mark" style="height:${h}px">
    <span class="logo-word${variant === 'cream' ? ' cream' : ''}">CongoFlow</span>
  </span>`;
export const LOGO_RED = logoHTML('ink');
export const LOGO_CREAM = logoHTML('cream');

const img = (id, cls = '', alt = '', loading = 'lazy') =>
  `<img src="${IMG(id)}" alt="${alt}" class="${cls}" ${loading === 'eager' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

// ——— Logo des pages légales provisoires ———
function legalPage(kind) {
  return `
  <div class="page-legal">
    <nav class="legal-nav"><a href="#/" class="btn btn-ghost btn-sm">${'← ' + t('landing.footerLinks.home')}</a></nav>
    <div class="card legal-card reveal in">
      <h1 class="t-h2">${t('landing.footerLinks.' + kind)}</h1>
      <p class="t-body mt-8">${t('landing.provisional')}</p>
      <p class="t-small mt-16">CongoFlow — Kinshasa, RDC · ${new Date().getFullYear()}</p>
    </div>
  </div>`;
}

export function renderLanding(root, opts = {}) {
  const s = state();
  const words = t('landing.heroWords');
  const posters = ['rumba', 'club', 'conf', 'foot', 'wax', 'gospel', 'gastro', 'roof'];
  const faqs = t('landing.faqs');
  const benefits = t('landing.benefits');
  const pillars = t('landing.pillars');

  // Images du bandeau défilant (2 rangées) : affiches + ambiances, format paysage
  const marqueePool = ['w-scene-crowd', 'w-scene-friends', 'w-scene-dancers', 'w-scene-hall', 'w-poster-rumba', 'w-poster-foot', 'w-poster-wax', 'w-poster-gospel'];
  const marqueeImgs = (from) => marqueePool.slice(from, from + 4).concat(marqueePool.slice(from, from + 4))
    .map(id => `<div class="mcell"><img src="${IMG(id)}" alt="" loading="lazy" decoding="async"></div>`).join('');

  root.innerHTML = `
  <div class="landing" id="landing">

    <!-- Nav pilule flottante -->
    <header class="lnav" id="lnav">
      <a href="#/" class="lnav-logo" aria-label="CongoFlow">${LOGO_RED}</a>
      <nav class="lnav-links" aria-label="Menu">
        <a href="#features">${t('landing.features')}</a>
        <a href="#faq">${t('landing.faq')}</a>
      </nav>
      <div class="lnav-actions">
        <div class="lang-menu" id="langTop"></div>
        <a href="#/auth" class="lnav-login">${t('landing.login')}</a>
        <a href="#/auth" class="btn btn-primary btn-sm btn-magnet">${t('landing.start')}</a>
        <button class="lnav-burger" id="lnavBurger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
      </div>
    </header>
    <div class="lnav-drawer" id="lnavDrawer">
      <a href="#features">${t('landing.features')}</a>
      <a href="#faq">${t('landing.faq')}</a>
      <a href="#/auth">${t('landing.login')}</a>
      <a href="#/auth" class="btn btn-primary">${t('landing.start')}</a>
    </div>

    <!-- Hero -->
    <section class="hero" id="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1 class="t-display reveal">${t('landing.heroTitleLead')} <span class="serif-accent">${t('landing.heroTitleAccent')}</span></h1>
          <p class="hero-sub t-body reveal">${t('landing.heroSubLead')}<br>
            <span>${t('landing.heroSubPrefix')}</span> <span class="tw-word serif-accent" id="twWord"></span><span class="typewriter-cursor" aria-hidden="true"></span> <span>${t('landing.heroSubSuffix')}</span>
          </p>
        <div class="hero-ctas reveal">
          <a href="#/auth" class="btn btn-primary btn-lg btn-magnet">${t('landing.heroCta')}</a>
          <a href="#features" class="btn btn-ghost btn-lg">${t('landing.features')}</a>
        </div>
      </div>

        <div class="hero-phone-zone" aria-hidden="true">
          <div class="hero-glow"></div>
          <div class="hero-phone" id="heroPhone">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <div class="ph-status"><span>9:41</span><span>▲▲▲ ⚡</span></div>
              <div class="ph-card-stack">
                ${posters.slice(0, 5).map((p, i) => `<div class="ph-card ${i === 0 ? 'on' : ''}" data-i="${i}">${img('w-poster-' + p)}<div class="ph-card-cap"><span class="badge-hype">🔥 ${120 + i * 47}</span><strong>${t('landing.heroWords')[i % words.length]}</strong></div></div>`).join('')}
              </div>
              <div class="ph-actions">
                <button class="pha pha-x" tabindex="-1" aria-hidden="true">✕</button>
                <button class="pha pha-heart" tabindex="-1" aria-hidden="true">♥</button>
              </div>
              <div class="ph-fly" id="phFly"><span>♥</span> ${t('nav.mine')}</div>
              <div class="ph-homebar"></div>
            </div>
          </div>
          <div class="hero-chip hc1">🔥 ${t('common.hype')} +18%</div>
          <div class="hero-chip hc2">♥ ${t('feed.like')}</div>
        </div>
      </div>
    </section>

    <!-- Manifeste -->
    <section class="manifesto" id="manifesto">
      <p class="manifesto-text" id="manifestoText">${t('landing.manifesto')}</p>
      <div class="pillars stagger" id="pillars">
        ${pillars.map(p => `<div class="pillar card"><div class="pillar-ico">${{ 'Découvrir': '🧭', 'Publier': '📣', 'Partager': '✨', 'Discover': '🧭', 'Post': '📣', 'Share': '✨', 'Monk': '🧭', 'Banda': '📣' }[p.title] || '✨'}</div><h3 class="t-h3">${p.title}</h3><p class="t-body">${p.text}</p></div>`).join('')}
      </div>
    </section>

    <!-- Pourquoi CongoFlow : images défilantes en ARRIÈRE-PLAN derrière les 4 cases -->
    <section class="why" id="features">
      <div class="marquee-band" aria-hidden="true">
        <div class="mrow mrow-top"><div class="mtrack">${marqueeImgs(0)}${marqueeImgs(0)}</div></div>
        <div class="mrow mrow-bottom"><div class="mtrack rev">${marqueeImgs(4)}${marqueeImgs(4)}</div></div>
      </div>
      <div class="why-content">
        <h2 class="t-h2 reveal">${t('landing.whyTitleLead')} <span class="serif-accent">${t('landing.whyTitleAccent')}</span> ?</h2>
        <p class="t-body reveal">${t('landing.whySubtitle')}</p>
        <div class="benefits benefits-row" id="benefits">
          ${benefits.map((b, i) => `
          <article class="benefit card reveal">
            <span class="benefit-num">${i + 1}</span>
            <div><h3 class="t-h3">${b.title}</h3><p class="t-body">${b.text}</p></div>
          </article>`).join('')}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq" id="faq">
      <h2 class="t-h2 reveal center">${t('landing.faqTitle')}</h2>
      <div class="faq-list" id="faqList">
        ${faqs.map((f, i) => `
        <div class="faq-item card reveal">
          <button class="faq-q" aria-expanded="false" aria-controls="faqa${i}">
            <span>${f.q}</span><svg class="faq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="faq-a" id="faqa${i}" role="region"><p class="t-body">${f.a}</p></div>
        </div>`).join('')}
      </div>
    </section>

    <!-- CTA finale -->
    <section class="cta-final reveal">
      <h2 class="t-display">${t('landing.ctaTitleLead')} <span class="serif-accent">${t('landing.ctaTitleAccent')}</span>${t('landing.ctaTitleEnd')}</h2>
      <p class="t-body cta-sub">${t('landing.ctaSubtitle')}</p>
      <a href="#/auth" class="btn btn-primary btn-lg btn-magnet cta-btn">${t('landing.ctaButton')}</a>
      <p class="cta-note t-small">${t('landing.ctaNote')}</p>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          ${LOGO_CREAM}
          <p class="t-body">${t('landing.footerPhrase')}</p>
          <p class="footer-cta t-small">${t('landing.footerCta')}</p>
          <a href="#/auth" class="btn btn-primary btn-sm footer-cta-btn">${t('landing.footerCtaBtn')}</a>
        </div>
        <div class="footer-cols">
          <div><h4>${t('landing.footerProduct')}</h4>
            <a href="#features">${t('landing.footerLinks.features')}</a>
            <a href="#faq">${t('landing.footerLinks.faq')}</a>
            <a href="#/app">${t('common.openApp')}</a>
          </div>
          <div><h4>${t('landing.footerHelp')}</h4>
            <a href="#/legal/help">${t('landing.footerLinks.helpCenter')}</a>
            <a href="#/legal/contact">${t('landing.footerLinks.contact')}</a>
          </div>
          <div><h4>${t('landing.footerLegal')}</h4>
            <a href="#/legal/cgv">${t('landing.footerLinks.cgv')}</a>
            <a href="#/legal/privacy">${t('landing.footerLinks.privacy')}</a>
            <a href="#/legal/rules">${t('landing.footerLinks.rules')}</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span class="t-small">© ${new Date().getFullYear()} CongoFlow · ${t('landing.footerRights')}</span>
          <div class="footer-social" aria-label="Réseaux sociaux">
            <a href="#/" aria-label="Instagram">◉</a><a href="#/" aria-label="Facebook">ƒ</a><a href="#/" aria-label="X">𝕏</a><a href="#/" aria-label="WhatsApp">✆</a>
          </div>
          <div class="lang-menu on-dark" id="langFooter"></div>
        </div>
      </div>
    </footer>
  </div>`;

  // ————— Interactions —————
  const $ = (q) => root.querySelector(q);
  const $$ = (q) => [...root.querySelectorAll(q)];

  // Nav : descend à l'arrivée avec léger rebond
  requestAnimationFrame(() => requestAnimationFrame(() => $('#lnav').classList.add('in')));

  // Burger mobile
  const burger = $('#lnavBurger'), drawer = $('#lnavDrawer');
  burger.addEventListener('click', () => {
    const on = drawer.classList.toggle('show');
    burger.classList.toggle('open', on);
    burger.setAttribute('aria-expanded', on);
  });
  drawer.addEventListener('click', e => { if (e.target.closest('a')) { drawer.classList.remove('show'); burger.classList.remove('open'); } });

  // Machine à écrire
  const tw = $('#twWord');
  if (tw) {
    let wi = 0, ci = 0, del = false;
    (function tick() {
      const w = words[wi % words.length];
      tw.textContent = w.slice(0, ci);
      if (!del && ci < w.length) { ci++; setTimeout(tick, 90); }
      else if (!del && ci === w.length) { del = true; setTimeout(tick, 1700); }
      else if (del && ci > 0) { ci--; setTimeout(tick, 45); }
      else { del = false; wi++; setTimeout(tick, 300); }
    })();
  }

  // Téléphone : rotation des affiches + petite démo swipe/cœur
  const phCards = $$('.ph-card');
  let pci = 0;
  const rot = setInterval(() => {
    const c = phCards[pci]; if (!c || !root.isConnected) { clearInterval(rot); return; }
    c.classList.remove('on');
    pci = (pci + 1) % phCards.length;
    phCards[pci].classList.add('on');
  }, 5500);
  const phone = $('#heroPhone');
  let demoT = setTimeout(function demo() {
    if (!root.isConnected || !phone) { clearTimeout(demoT); return; }
    phone.classList.add('demo-swipe');
    setTimeout(() => {
      if (!root.isConnected) return;
      $('#phFly')?.classList.add('go');
      const h = phone.querySelector('.pha-heart');
      h && h.classList.add('beat');
    }, 1100);
    setTimeout(() => {
      if (!root.isConnected) return;
      phone.classList.remove('demo-swipe');
      $('#phFly')?.classList.remove('go');
      const h = phone.querySelector('.pha-heart');
      h && h.classList.remove('beat');
    }, 3200);
    demoT = setTimeout(demo, 11000);
  }, 2600);

  // Manifeste : mot par mot au scroll
  const mt = $('#manifestoText');
  if (mt) {
    const wordsArr = mt.textContent.trim().split(/\s+/);
    mt.innerHTML = wordsArr.map(w => `<span class="mw">${w}</span>`).join(' ');
    const mws = $$('.mw');
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) mws.forEach((w, i) => setTimeout(() => w.classList.add('lit'), i * 65)); });
    }, { threshold: .4 });
    io.observe(mt);
  }

  // Reveal générique + stagger
  const ro = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); if (e.target.id === 'pillars' || e.target.classList.contains('stagger')) e.target.classList.add('in'); ro.unobserve(e.target); }
  }), { threshold: .18, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .stagger').forEach(el => ro.observe(el));

  // FAQ accordéon
  $$('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement, a = item.querySelector('.faq-a');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
  });

  // Marquee : légère accélération au survol (desktop), pause si reduced motion
  // (le défilement continu est en CSS @keyframes, GPU-friendly)

  // Boutons magnétiques (desktop)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.btn-magnet').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${dx * 7}px, ${dy * 5}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  // Sélecteurs de langue (barre + footer) — un seul ouvert à la fois
  const mountLang = (elId, dark) => {
    const host = $(elId);
    if (!host) return;
    host.classList.toggle('on-dark', !!dark);
    const names = { fr: 'Français', en: 'English', ln: 'Lingala ⚠︎' };
    host.innerHTML = `
      <button class="lang-btn" aria-haspopup="true" aria-expanded="false">${(state().lang || 'fr').toUpperCase()} ▾</button>
      <div class="lang-pop" role="menu">
        ${['fr', 'en', 'ln'].map(l => `<button role="menuitem" data-l="${l}" class="${state().lang === l ? 'cur' : ''}"><span>${names[l]}</span>${state().lang === l ? '✓' : ''}</button>`).join('')}
      </div>`;
    const btn = host.querySelector('.lang-btn'), pop = host.querySelector('.lang-pop');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.lang-pop.show').forEach(p => { if (p !== pop) { p.classList.remove('show'); p.parentElement.classList.remove('on'); } });
      const on = host.classList.toggle('on');
      btn.setAttribute('aria-expanded', on);
      pop.classList.toggle('show', on);
    });
    pop.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      setLang(b.dataset.l);
      renderLanding(root, opts);
    }));
  };
  mountLang('#langTop', false);
  mountLang('#langFooter', true);
  document.addEventListener('click', () => { root.querySelectorAll('.lang-pop.show').forEach(p => { p.classList.remove('show'); p.parentElement.classList.remove('on'); }); }, { once: true });

  // Nettoyage des timers si la page change
  return () => { clearInterval(rot); clearTimeout(demoT); };
}

export { legalPage };
