// CongoFlow — Authentification + onboarding (5 questions)
import { t, tx, state, save, uid, setLang, IMG } from './core.js';
import { COMMUNES } from './data/demo.js';

const authImgs = ['concert', 'dance', 'orga', 'street', 'culture'];
const imgAuth = (id, cls = '', alt = '') => `<img src="${IMG(id)}" class="${cls}" alt="${alt}" loading="lazy" decoding="async">`;

export function renderAuth(root, nav) {
  const s = state();
  let mode = 'login';        // login | signup
  let showPwd = false;       // œil : bascule le type sans jamais effacer la saisie
  let timer = null;

  root.innerHTML = `
  <div class="auth-page">
    <button class="auth-back" id="authBack" aria-label="${t('common.back')}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${t('common.back')}</span>
    </button>
    <div class="auth-visual">
      <span class="av-logo" role="img" aria-label="CongoFlow">
        <img src="${IMG('logo-cream')}" alt="" class="logo-mark" style="height:30px">
        <span class="logo-word cream">CongoFlow</span>
      </span>
      <div class="av-slides" aria-hidden="true">
        ${authImgs.map((im, i) => `<div class="av-slide ${i === 0 ? 'on' : ''}" data-i="${i}">${imgAuth('w-authm-' + im)}</div>`).join('')}
      </div>
      <div class="av-msgs" aria-hidden="true">
        ${t('auth.authMsgs').map((m, i) => `<div class="av-msg ${i === 0 ? 'on' : ''}" data-i="${i}">${m}</div>`).join('')}
      </div>
    </div>
    <div class="auth-panel">
      <div class="auth-card" id="authCard">
        <div class="auth-mode">
          <button class="am-btn on" data-mode="login" role="tab">${t('auth.login')}</button>
          <button class="am-btn" data-mode="signup" role="tab">${t('auth.signup')}</button>
          <span class="am-ink"></span>
        </div>
        <div id="authBody"></div>
      </div>
      <p class="auth-foot t-small">CongoFlow · Kinshasa 🇨🇩</p>
    </div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const body = $('#authBody');

  // Bouton retour (haut gauche de la page)
  $('#authBack').addEventListener('click', () => { location.hash = '#/'; });

  // Rotation des images (6 s) + messages forts
  let si = 0;
  const rot = setInterval(() => {
    si = (si + 1) % authImgs.length;
    root.querySelectorAll('.av-slide').forEach(el => el.classList.toggle('on', +el.dataset.i === si));
    root.querySelectorAll('.av-msg').forEach(el => el.classList.toggle('on', +el.dataset.i === si));
  }, 6000);

  // Basculage login/signup (la charnière glisse via la classe .right)
  root.querySelectorAll('.am-btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    root.querySelectorAll('.am-btn').forEach(x => x.classList.toggle('on', x === b));
    $('.am-ink').classList.toggle('right', mode !== 'login');
    renderForm();
  }));

  function fieldErr(name, msgKey) {
    const f = body.querySelector(`[data-field="${name}"]`);
    if (!f) return;
    const msgEl = f.querySelector('.field-msg');
    f.classList.add('invalid', 'cf-shake');
    setTimeout(() => f.classList.remove('cf-shake'), 400);
    msgEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> ${t(msgKey)}`;
    msgEl.classList.add('show');
    f.querySelector('input')?.focus();
  }
  function clearErrs() { body.querySelectorAll('.field.invalid').forEach(f => f.classList.remove('invalid')); body.querySelectorAll('.field-msg.show').forEach(m => m.classList.remove('show')); }

  const EYE_OPEN = '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8"/>';
  const EYE_CLOSED = '<path d="M4 4l16 16M9.9 5.7A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a17.6 17.6 0 0 1-3.2 3.9M6.6 7.2A17.3 17.3 0 0 0 2 12s3.5 6.5 10 6.5c1.2 0 2.3-.2 3.3-.6M10 10.2a2.7 2.7 0 0 0 3.8 3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

  // ————— Formulaire —————
  function renderForm() {
    clearErrs();
    const isSignup = mode === 'signup';
    body.innerHTML = `
      <h1 class="t-h2 auth-title">${isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}</h1>

      <button class="btn btn-google btn-block" id="googleBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.9-5l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.1 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.01-.16-3.7-2.8-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.8-3z"/><path fill="#EA4335" d="M12 4.6c2.2 0 3.7.9 4.6 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.3 6.6l3.8 3c1-2.9 3.7-5 6.9-5z"/></svg>
        <span>${t('auth.googleBtn')}</span>
      </button>
      <p class="google-hint t-small hidden" id="googleHint">${t('auth.googleHint')}</p>
      <div class="auth-or"><span>${t('common.or')}</span></div>

      ${isSignup ? `
      <div class="field" data-field="name">
        <label for="f-name">${t('auth.name')}</label>
        <input id="f-name" type="text" placeholder="${t('auth.namePlaceholder')}" autocomplete="name">
        <p class="field-msg" role="alert"></p>
      </div>` : ''}

      <div class="field" data-field="email">
        <label for="f-email">${t('auth.email')}</label>
        <input id="f-email" type="email" placeholder="${t('auth.emailPlaceholder')}" autocomplete="email" inputmode="email">
        <p class="field-msg" role="alert"></p>
      </div>

      <div class="field" data-field="password">
        <label for="f-pwd">${t('auth.password')}</label>
        <div class="pwd-wrap">
          <input id="f-pwd" type="${showPwd ? 'text' : 'password'}" placeholder="${t('auth.passwordPlaceholder')}" autocomplete="${isSignup ? 'new-password' : 'current-password'}">
          <button type="button" class="pwd-eye" id="pwdEye" aria-label="${showPwd ? t('auth.hidePassword') : t('auth.showPassword')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">${showPwd ? EYE_OPEN : EYE_CLOSED}</svg>
          </button>
        </div>
        <p class="field-msg" role="alert"></p>
      </div>

      ${isSignup ? `
      <div class="field" data-field="confirm">
        <label for="f-pwd2">${t('auth.confirmPassword')}</label>
        <div class="pwd-wrap">
          <input id="f-pwd2" type="${showPwd ? 'text' : 'password'}" placeholder="${t('auth.confirmPasswordPlaceholder')}" autocomplete="new-password">
          <button type="button" class="pwd-eye" id="pwdEye2" aria-label="${showPwd ? t('auth.hidePassword') : t('auth.showPassword')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">${showPwd ? EYE_OPEN : EYE_CLOSED}</svg>
          </button>
        </div>
        <p class="field-msg" role="alert"></p>
      </div>

      <div class="field" data-field="phone">
        <label for="f-phone">${t('auth.phoneOptional')} <span class="t-small">(${t('common.optional')})</span></label>
        <input id="f-phone" type="tel" placeholder="${t('auth.phonePlaceholder')}" autocomplete="tel" inputmode="tel">
        <p class="field-msg" role="alert"></p>
      </div>
      <div class="phone-consent-row" id="phoneConsentRow">
        <label class="terms">
          <input type="checkbox" id="phoneConsent">
          <span>${t('auth.phoneConsent')}</span>
        </label>
      </div>` : `<button class="link-btn" id="forgotBtn">${t('auth.passwordForgot')}</button>`}

      <button class="btn btn-primary btn-block btn-lg mt-16" id="authGo">
        <span class="ago-label">${isSignup ? t('auth.signupBtn') : t('auth.loginBtn')}</span>
      </button>
      <p class="terms-note t-small">${t('auth.termsNote')}</p>
      <p class="slow-hint t-small" id="slowHint">${t('auth.errSlowNetwork')}</p>`;

    // Afficher/masquer le mot de passe — sans re-rendre le formulaire :
    // la saisie (et le focus) sont conservés tels quels.
    const togglePwd = () => {
      showPwd = !showPwd;
      ['#f-pwd', '#f-pwd2'].forEach(idq => {
        const inp = body.querySelector(idq);
        if (inp) inp.type = showPwd ? 'text' : 'password';
      });
      body.querySelectorAll('.pwd-eye svg').forEach(svg => svg.innerHTML = showPwd ? EYE_OPEN : EYE_CLOSED);
      body.querySelectorAll('.pwd-eye').forEach(b =>
        b.setAttribute('aria-label', showPwd ? t('auth.hidePassword') : t('auth.showPassword')));
    };
    body.querySelector('#pwdEye')?.addEventListener('click', togglePwd);
    body.querySelector('#pwdEye2')?.addEventListener('click', togglePwd);

    body.querySelector('#forgotBtn')?.addEventListener('click', renderForgot);

    // Connexion Google (simulée pour cette version)
    body.querySelector('#googleBtn').addEventListener('click', () => {
      const btn = body.querySelector('#googleBtn');
      btn.disabled = true;
      body.querySelector('#googleHint')?.classList.remove('hidden');
      setTimeout(() => {
        btn.disabled = false;
        body.querySelector('#googleHint')?.classList.add('hidden');
        finalize(false, 'toi.google@gmail.com', 'google-demo', 'Google Demo', 'me_google');
      }, 1400);
    });

    // Consentement téléphone : visible seulement si un numéro est saisi
    const phoneInp = body.querySelector('#f-phone');
    const consentRow = body.querySelector('#phoneConsentRow');
    if (phoneInp && consentRow) {
      const sync = () => consentRow.classList.toggle('show', phoneInp.value.trim().length > 0);
      phoneInp.addEventListener('input', sync);
      sync();
    }

    // Soumission e-mail
    body.querySelector('#authGo').addEventListener('click', () => {
      clearErrs();
      const get = id => (body.querySelector(id)?.value || '').trim();
      const em = get('#f-email');
      const pwd = body.querySelector('#f-pwd')?.value || '';
      const pwd2 = body.querySelector('#f-pwd2')?.value || '';
      const phone = get('#f-phone');

      if (isSignup && get('#f-name').length < 2) return fieldErr('name', 'auth.errNameRequired');
      if (!em) return fieldErr('email', 'auth.errEmailRequired');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fieldErr('email', 'auth.errEmailInvalid');
      if (!pwd) return fieldErr('password', 'auth.errPasswordRequired');
      if (isSignup) {
        if (pwd.length < 8) return fieldErr('password', 'auth.errPasswordShort');
        if (!/\d/.test(pwd)) return fieldErr('password', 'auth.errPasswordWeak');
        if (pwd2 !== pwd) return fieldErr('confirm', 'auth.errPasswordMismatch');
        if (phone) {
          const ph = phone.replace(/[\s.-]/g, '');
          if (!/^\+?\d{9,15}$/.test(ph)) return fieldErr('phone', 'auth.errPhoneInvalid');
          if (!body.querySelector('#phoneConsent').checked) return fieldErr('phone', 'auth.errPhoneConsent');
        }
      }
      goLogin(isSignup, em, pwd, get('#f-name'), phone);
    });
  }

  // Mot de passe oublié
  function renderForgot() {
    body.innerHTML = `
      <h1 class="t-h2 auth-title">${t('auth.passwordReset')}</h1>
      <div class="field" data-field="email">
        <label for="f-email2">${t('auth.email')}</label>
        <input id="f-email2" type="email" placeholder="${t('auth.emailPlaceholder')}">
        <p class="field-msg" role="alert"></p>
      </div>
      <button class="btn btn-primary btn-block btn-lg mt-16" id="resetGo">${t('auth.passwordReset')}</button>
      <button class="link-btn mt-12 center" id="backBtn">${t('common.back')}</button>`;
    body.querySelector('#backBtn').addEventListener('click', renderForm);
    body.querySelector('#resetGo').addEventListener('click', () => {
      const em = (body.querySelector('#f-email2').value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fieldErr('email', 'auth.errEmailInvalid');
      toast(t('auth.passwordResetSent'), 'ok');
      renderForm();
    });
  }

  // ————— Connexion / inscription (e-mail) —————
  function goLogin(isSignup, email, pwd, name, phone) {
    const btn = body.querySelector('#authGo');
    const label = btn.querySelector('.ago-label');
    const slowT = setTimeout(() => body.querySelector('#slowHint')?.classList.add('show'), 4000);
    btn.disabled = true; label.style.display = 'none';
    btn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner" aria-hidden="true"></span>');
    setTimeout(() => {
      clearTimeout(slowT);
      const st = state();
      const existing = st.user && st.user.email === email;
      const known = ['demo@congoflow.cd', 'grace@congoflow.cd'].includes(email.toLowerCase());
      const wrongPwd = pwd !== 'demo1234' && !existing;
      if (!isSignup && wrongPwd && !known && !existing) {
        // mot de passe incorrect → la carte vibre, la saisie est conservée
        btn.querySelector('.btn-spinner')?.remove(); label.style.display = ''; btn.disabled = false;
        $('#authCard').classList.add('cf-vibrate');
        setTimeout(() => $('#authCard').classList.remove('cf-vibrate'), 500);
        const f = body.querySelector('[data-field="password"]');
        const m = f.querySelector('.field-msg');
        m.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> ${t('auth.errWrongPassword')}`;
        m.classList.add('show'); f.classList.add('invalid');
        return;
      }
      // coche de réussite
      btn.querySelector('.btn-spinner')?.remove();
      btn.insertAdjacentHTML('afterbegin', '<svg class="check-draw play" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5.5 5.5L20 6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      setTimeout(() => finalize(isSignup, email, pwd, name || 'Nouveau Kinois', 'me_' + Math.random().toString(36).slice(2, 7), phone), 650);
    }, 900 + Math.random() * 500);
  }

  function finalize(isSignup, email, pwd, name, userId, phone) {
    const st = state();
    st.user = {
      id: userId || 'me', name, username: (name || 'demo').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + '.k',
      email, phone: phone || '', verified: false, followers: 0, following: 0, posts: 0,
      bio: { fr: '', en: '', ln: '' }, color: '#9B1C28', since: Date.now(),
    };
    save();
    nav(isSignup ? 'onboarding' : 'feed');
  }

  renderForm();
  return () => { clearInterval(rot); clearInterval(timer); };
}

// ———————————————————— Onboarding : 5 questions ————————————————————
export function renderOnboarding(root, nav) {
  const s = state();
  const cats = Object.keys(t('feed.categories'));
  const catNames = t('feed.categories');
  const answers = { cats: [], area: '', when: '', budget: '', role: '' };
  let q = 0;

  root.innerHTML = `
  <div class="onboarding">
    <div class="ob-head">
      <div class="ob-dots" id="obDots">${[0, 1, 2, 3, 4].map(i => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}</div>
      <button class="link-btn" id="obSkip">${t('onboarding.skip')}</button>
    </div>
    <div class="ob-card card" id="obCard"></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const card = $('#obCard');
  const dots = () => root.querySelectorAll('.ob-dots span').forEach((d, i) => d.classList.toggle('on', i === q));

  const questions = [
    () => { card.innerHTML = `
      <h2 class="t-h2 ob-title">${t('onboarding.q1')}</h2>
      <p class="t-body">${t('onboarding.q1hint')}</p>
      <div class="ob-chips wrap">${cats.map(c => `<button class="tag-chip ob-cat" data-c="${c}">${catNames[c]}</button>`).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg mt-24" id="obNext">${t('common.next')}</button>`;
      card.querySelectorAll('.ob-cat').forEach(b => b.addEventListener('click', () => {
        b.classList.toggle('sel');
        const c = b.dataset.c;
        answers.cats = answers.cats.includes(c) ? answers.cats.filter(x => x !== c) : [...answers.cats, c];
      }));
      $('#obNext').addEventListener('click', next); },
    () => { card.innerHTML = `
      <h2 class="t-h2 ob-title">${t('onboarding.q2')}</h2>
      <div class="ob-chips wrap">${COMMUNES.map((c, i) => `<button class="tag-chip ob-com" data-c="${c}">${c}</button>`).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg mt-24" id="obNext">${t('common.next')}</button>`;
      card.querySelectorAll('.ob-com').forEach(b => b.addEventListener('click', () => {
        card.querySelectorAll('.ob-com').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); answers.area = b.dataset.c;
      }));
      $('#obNext').addEventListener('click', next); },
    () => { card.innerHTML = `
      <h2 class="t-h2 ob-title">${t('onboarding.q3')}</h2>
      <div class="ob-big-choices">${[['week', t('onboarding.q3week')], ['weekend', t('onboarding.q3weekend')], ['both', t('onboarding.q3both')]].map(([v, l]) => `<button class="ob-big" data-v="${v}">${l}</button>`).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg mt-24" id="obNext">${t('common.next')}</button>`;
      card.querySelectorAll('.ob-big').forEach(b => b.addEventListener('click', () => { card.querySelectorAll('.ob-big').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); answers.when = b.dataset.v; }));
      $('#obNext').addEventListener('click', next); },
    () => { card.innerHTML = `
      <h2 class="t-h2 ob-title">${t('onboarding.q4')}</h2>
      <div class="ob-big-choices">${[['free', t('onboarding.q4free')], ['small', t('onboarding.q4small')], ['premium', t('onboarding.q4premium')]].map(([v, l]) => `<button class="ob-big" data-v="${v}">${l}</button>`).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg mt-24" id="obNext">${t('common.next')}</button>`;
      card.querySelectorAll('.ob-big').forEach(b => b.addEventListener('click', () => { card.querySelectorAll('.ob-big').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); answers.budget = b.dataset.v; }));
      $('#obNext').addEventListener('click', next); },
    () => { card.innerHTML = `
      <h2 class="t-h2 ob-title">${t('onboarding.q5')}</h2>
      <div class="ob-big-choices">${[['attend', t('onboarding.q5attend')], ['organize', t('onboarding.q5organize')], ['both', t('onboarding.q5both')]].map(([v, l]) => `<button class="ob-big" data-v="${v}">${l}</button>`).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg mt-24" id="obFinish">${t('onboarding.finish')}</button>`;
      card.querySelectorAll('.ob-big').forEach(b => b.addEventListener('click', () => { card.querySelectorAll('.ob-big').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); answers.role = b.dataset.v; }));
      $('#obFinish').addEventListener('click', finish); },
  ];

  function show() { dots(); card.classList.remove('ob-in'); void card.offsetWidth; card.classList.add('ob-in'); questions[q](); }
  function next() { if (q < 4) { q++; show(); } }
  function finish() {
    s.onboarding = answers; save();
    toast(t('onboarding.savedToast'), 'ok');
    nav('feed');
  }
  $('#obSkip').addEventListener('click', () => { s.onboarding = null; save(); toast(t('onboarding.skippedToast')); nav('feed'); });

  show();
}
