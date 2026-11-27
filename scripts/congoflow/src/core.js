// CongoFlow — Core : store persistant, hype, recommandation, icônes, modération, PWA
import { demoEvents, demoUsers, demoNotifications, demoConversations, demoHashtagPool } from './data/demo.js';
import { CITIES, nearestCity } from './data/cities.js';
import I18N from './i18n/fr.js';
import I18N_EN from './i18n/en.js';
import I18N_LN from './i18n/ln.js';

export const I18N_DICTS = { fr: I18N, en: I18N_EN, ln: I18N_LN };
export { CITIES, nearestCity };

// ———————————————————— Store ————————————————————
const KEY = 'congoflow_v1';

function uid(p = 'id') { return p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }

function seed() {
  return {
    lang: null, // détecté à la première visite
    user: null,
    users: structuredClone(demoUsers),
    events: [],         // événements démo + créés
    drafts: [],
    myLikes: [],        // ids aimés (swipe droite / bouton)
    myPasses: [],
    myBoosts: [],       // { ev, day }
    myReminders: [],
    myComments: {},     // evId -> [{id,user:'me',text,ts}]
    notifs: structuredClone(demoNotifications).map(n => ({ ...n, id: uid('n'), read: false })),
    convs: structuredClone(demoConversations),
    follows: [],
    blocked: [],
    reports: [],        // signalements
    modQueue: [],       // file de vérification
    appeals: [],        // recours
    searchHistory: [],
    seenIntro: false,   // tutoriel du fil (aussi copié sur le compte : user.seenIntro)
    onboarding: null,   // réponses aux 5 questions
    viewedTags: [],
    settings: {
      notifLikes: true, notifComments: true, notifFollows: true, notifReminders: true, notifMessages: true, notifHype: true,
      channelPush: true, channelEmail: false, channelSms: false,
      privateLikes: false, allowDM: 'everyone', profileVisible: 'everyone',
      autoCity: true, otherCitiesHyped: true,
    },
    hypeLog: {},        // evId -> timestamps d'activité (pour récence)
    deleteReasons: [],  // raisons de suppression (anonymes)
  };
}

let S = null;
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      S = JSON.parse(raw);
      // migration douce : nouvelles clés de réglages pour les anciens comptes
      S.settings = Object.assign({}, seed().settings, S.settings);
      return;
    }
  } catch (e) { /* stockage indisponible : mode mémoire */ }
  S = seed();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}
export function state() { return S; }

// Initialise ou rafraîchit les événements démo (dates relatives au jour actuel)
export function ensureDemoEvents() {
  // seed si vide OU si les ids démo ont disparu (ex. compte supprimé puis recréé)
  const demoIds = demoEvents().map(e => e.id);
  const mine = S.user ? S.events.some(e => e.organizer === S.user.id) : false;
  const missing = demoIds.filter(id => !S.events.some(e => e.id === id));
  if (!S.events.length || (missing.length && !mine)) {
    const existing = S.events.filter(e => (S.user && e.organizer === S.user.id) || !demoIds.includes(e.id));
    S.events = [...demoEvents().map(e => ({ ...e, status: 'ok' })), ...existing];
    save();
  }
  // garantie : tout événement sans statut est visible
  S.events.forEach(e => { if (!e.status) e.status = 'ok'; });
}

// ———————————————————— i18n ————————————————————
export function detectLang() {
  if (S.lang) return S.lang;
  const nav = (navigator.language || 'fr').toLowerCase();
  S.lang = nav.startsWith('en') ? 'en' : nav.startsWith('ln') ? 'ln' : 'fr';
  save();
  return S.lang;
}
export function setLang(l) {
  S.lang = l; save();
  document.documentElement.lang = l;
  // fondu rapide du texte
  document.body.classList.remove('lang-fading');
  void document.body.offsetWidth;
  document.body.classList.add('lang-fading');
}
export function t(path, vars) {
  const dict = I18N_DICTS[S?.lang || 'fr'] || I18N;
  const walk = (o, parts) => parts.reduce((a, k) => (a && a[k] !== undefined) ? a[k] : undefined, o);
  let v = walk(dict, path.split('.'));
  if (v === undefined) v = walk(I18N, path.split('.')); // fallback FR
  if (v === undefined) return path;
  if (typeof v === 'string' && vars) for (const k in vars) v = v.replaceAll('{' + k + '}', vars[k]);
  return v;
}
// Texte multilingue des données : { fr, en, ln } -> chaîne dans la langue courante (fr par défaut)
export function tx(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[S?.lang] || obj.fr || Object.values(obj)[0] || '';
}

// Image inline (défini par le build ; marqueur si absente)
function IMG(id) { return (typeof CF_IMG !== 'undefined' && CF_IMG[id]) || ('__IMG_' + id + '__'); }
export { IMG };

// ———————————————————— Icônes SVG (jeu homogène, traits fins 1.9) ————————————————————
// Un seul jeu pour toute l'interface : même épaisseur, couleur currentColor.
const I = (d, extra = '') =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}/></svg>`;
export const ICONS = {
  home: 'M3 10.5L12 3l9 7.5V21h-6v-6h-6v6H3z',
  calendar: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  plus: 'M12 5v14M5 12h14',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  heart: 'M12 20.5S3.5 15.5 3.5 9.3A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.5 2.9c0 6.2-8.5 11.2-8.5 11.2z',
  x: 'M6 6l12 12M18 6L6 18',
  undo: 'M9 14L4 9l5-5M4 9h9a7 7 0 1 1 0 14h-1',
  flame: 'M12 2.5c1 3-1.2 4.6-2.6 6C8 9.9 7 11.4 7 13.3A5.4 5.4 0 0 0 12.4 19a5.5 5.5 0 0 0 5.6-5.5c0-2.6-1.4-3.9-2.4-5.4-.4 1-1 1.6-1.9 2 .5-2.8-.3-6.1-1.7-8.6z',
  comment: 'M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.4-5.1A8.5 8.5 0 1 1 21 12z',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  bookmark: 'M6 3h12v18l-6-4.5L6 21z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16.5 16.5L21 21',
  pin: 'M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11zM12 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  settings: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5l3.5 2',
  chevL: 'M15 5l-7 7 7 7',
  chevR: 'M9 5l7 7-7 7',
  chevD: 'M6 9l6 6 6-6',
  ticket: 'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8zM13 6v12',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  globe: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 9.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z',
  eyeOff: 'M4 4l16 16M9.9 5.7A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a17.6 17.6 0 0 1-3.2 3.9M6.6 7.2A17.3 17.3 0 0 0 2 12s3.5 6.5 10 6.5c1.2 0 2.3-.2 3.3-.6M10 10.2a2.7 2.7 0 0 0 3.8 3.8',
  warn: 'M12 3l10 18H2L12 3zM12 10v5M12 17.5v.5',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M17 3l4 4L8 20l-5 1 1-5L17 3zM14 6l4 4',
  check: 'M4 12.5l5.5 5.5L20 6.5',
  close: 'M6 6l12 12M18 6L6 18',
  dots: 'M12 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM19 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM5 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  sparkle: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2zM19 15l.9 3.1L23 19l-3.1.9L19 23l-.9-3.1L15 19l3.1-.9L19 15z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  logout: 'M9 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5M16 17l5-5-5-5M21 12H9',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11zM12 17a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  ut: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01',
  flag: 'M4 22V4c3-1.8 6 1.8 9 0s5-.8 7 0v10c-2-.8-4-1.8-7 0s-6-1.8-9 0',
  block: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM5.6 5.6l12.8 12.8',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  city: 'M4 21V8l6-3v16M10 21V11l6-2v12M16 21V13l4-1v9M2 21h20',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
  tag: 'M20.6 13.4L11 3.8A2 2 0 0 0 9.6 3.2H4a1 1 0 0 0-1 1v5.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.8zM7.5 8.5h.01',
  chart: 'M3 3v18h18M7 15l4-5 3 3 5-7',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  // icônes catégories (pastilles)
  catAll: 'M4 6h16M4 12h16M4 18h10',
  catParty: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z',
  catConcert: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  catConference: 'M8 21l4-10 4 10M3 21h18M12 11V3M12 3a2 2 0 1 0 0-.01',
  catSport: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18M3.5 9h17M3.5 15h17',
  catCulture: 'M12 3l10 5-10 5L2 8l10-5zM2 8v8M22 8v8M12 13v8',
  catGastronomy: 'M7 3v8a3 3 0 0 0 6 0V3M10 11v10M17 3c-1.5 2-2 3.5-2 5s.7 2.5 2 2.5S19 10 19 8.5 18.5 5 17 3zM17 10.5V21',
  catFashion: 'M8 3l4 3 4-3 4 4-3 3v11H7V10L4 7l4-4zM12 6v15',
  catChurch: 'M12 3l2 5h-4l2-5zM5 21V10l7-4 7 4v11M5 21h14M10 21v-4a2 2 0 1 1 4 0v4',
  catSolidarity: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
  catFair: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h.01M12 11h.01M15 11h.01',
};
export function icon(name, size = 22, cls = '') {
  const d = ICONS[name] || ICONS.sparkle;
  return `<svg ${size !== 22 ? `width="${size}" height="${size}"` : 'width="22" height="22"'} viewBox="0 0 24 24" fill="none" aria-hidden="true" class="${cls}"><path d="${d}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ———————————————————— Hype ————————————————————
// vues×1, likes×3, commentaires×4, enregistrements×5, partages×6, boosts×8
// × facteur de récence (activité récente compte plus) × facteur de proximité de la date
export function hypeScore(ev, now = Date.now()) {
  const s = ev.stats || {};
  const base = (s.views || 0) * 1 + (s.likes || 0) * 3 + (s.comments || 0) * 4
    + (s.saves || 0) * 5 + (s.shares || 0) * 6 + (s.boosts || 0) * 8;
  // récence de l'activité : pics récents pèsent plus (décroissance sur 14 jours)
  const log = (S.hypeLog && S.hypeLog[ev.id]) || [];
  const recentBoost = log.filter(ts => now - ts < 14 * 864e5).length * 2;
  const ageDays = Math.max(0, (now - new Date(ev.ts || ev.date).getTime()) / 864e5);
  const recency = Math.max(.35, 1 - ageDays / 40);
  // proximité de la date : monte à l'approche de l'événement (max ×1.8 à J-1, retombe après)
  const daysTo = (new Date(ev.date).getTime() - now) / 864e5;
  let proximity = 1;
  if (daysTo >= 0) proximity = 1 + Math.max(0, (14 - Math.min(14, daysTo)) / 14) * .8;
  else proximity = Math.max(.2, 1 + daysTo / 7);
  return Math.round((base + recentBoost) * recency * proximity);
}
export function hypeLevel(score) {
  if (score < 800) return 0;
  if (score < 2000) return 1;
  if (score < 4000) return 2;
  if (score < 8000) return 3;
  if (score < 15000) return 4;
  return 5;
}
export function bumpStat(evId, key, n = 1) {
  const ev = S.events.find(e => e.id === evId);
  if (!ev) return;
  ev.stats = ev.stats || {};
  ev.stats[key] = (ev.stats[key] || 0) + n;
  (S.hypeLog[evId] = S.hypeLog[evId] || []).push(Date.now());
  save();
}
export function todayBoosts() {
  const day = new Date().toISOString().slice(0, 10);
  return S.myBoosts.filter(b => b.day === day);
}

// ———————————————————— Recommandation (façon TikTok) ————————————————————
// Apprend : likes, passes, boosts, hashtags consultés, onboarding, ville, proximité date.
// Priorité : ta ville d'abord ; les autres villes ne passent que si très hypées.
export function feedOrder(opts = {}) {
  const now = Date.now();
  const myCity = opts.city || (S.user && S.user.city) || 'Kinshasa';
  const tab = opts.tab || 'foryou';
  const cat = opts.category || 'all';
  const catScore = {};   // affinités par catégorie
  const tagScore = {};   // affinités par hashtag
  const areaScore = {};  // affinités par quartier
  const add = (m, k, v) => { m[k] = (m[k] || 0) + v; };

  // onboarding (5 questions)
  const ob = S.onboarding;
  if (ob) {
    (ob.cats || []).forEach(c => add(catScore, c, 6));
    if (ob.area) add(areaScore, ob.area, 8);
    (ob.budget === 'free') && (catScore.__free = 4);
    (ob.budget === 'premium') && (catScore.__paid = 4);
  }
  // comportement
  S.myLikes.forEach(id => { const e = ev(id); if (e) { add(catScore, e.category, 5); e.hashtags.forEach(h => add(tagScore, h, 3)); add(areaScore, e.area, 2); } });
  S.myPasses.forEach(id => { const e = ev(id); if (e) { add(catScore, e.category, -2); } });
  S.myBoosts.forEach(b => { const e = ev(b.ev); if (e) { add(catScore, e.category, 4); e.hashtags.forEach(h => add(tagScore, h, 2)); } });
  (S.viewedTags || []).forEach(h => add(tagScore, h, 2));

  // pool de base : à venir, visibles, pas encore notés
  let pool = S.events.filter(e => e.status === 'ok' && !S.myLikes.includes(e.id) && !S.myPasses.includes(e.id) && new Date(e.date) > new Date(now));
  if (cat !== 'all') pool = pool.filter(e => e.category === cat);

  // Onglets
  if (tab === 'mycity') pool = pool.filter(e => e.city === myCity);
  else if (tab === 'hyped') pool = pool.filter(e => hypeLevel(hypeScore(e)) >= 3);

  // seuil national : hors « Ma ville », les autres villes ne passent que si très hypées
  const all = pool.map(e => hypeScore(e)).sort((a, b) => b - a);
  const threshold = all.length ? all[Math.max(0, Math.floor(all.length * 0.1) - 1)] : 0;

  return pool.map(e => {
    let sc = 0;
    sc += (catScore[e.category] || 0) * 3;
    e.hashtags.forEach(h => { sc += (tagScore[h] || 0) * 2; });
    sc += areaScore[e.area] || 0;
    sc += hypeLevel(hypeScore(e)) * 4;                 // hype forte = plus visible
    const daysTo = (new Date(e.date) - now) / 864e5;   // proximité de la date
    sc += daysTo < 3 ? 10 : daysTo < 7 ? 6 : daysTo < 14 ? 3 : 0;
    // localisation : ta ville en priorité forte
    if (e.city === myCity) sc += 60;
    else {
      const hs = hypeScore(e);
      const pass = tab === 'mycity' ? false : (S.settings.otherCitiesHyped ? hs >= threshold : false);
      if (!pass && tab !== 'hyped') return null;       // filtré : autre ville pas assez hypée
      sc += Math.min(30, hs / 500);                    // hype nationale : bonus plafonné
    }
    sc += Math.random() * 3;                            // légère variation (diversité)
    return { e, sc };
  }).filter(Boolean).sort((a, b) => b.sc - a.sc).map(x => x.e);
}

export function ev(id) { return S.events.find(e => e.id === id); }
export function userById(id) { return id === (S.user && S.user.id) ? S.user : S.users.find(u => u.id === id); }

// Avatar HTML : photo de profil si présente, sinon initiales sur fond couleur
export function avatarHTML(u, cls = '') {
  if (!u) return `<span class="ev-avatar ${cls}">?</span>`;
  if (u.photo) return `<span class="ev-avatar has-photo ${cls}" style="background:${u.color || '#9B1C28'}"><img src="${u.photo}" alt=""></span>`;
  return `<span class="ev-avatar ${cls}" style="background:${u.color || '#0E0E10'}">${(u.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('')}</span>`;
}

// Tendances : hashtags des événements avec la plus forte hype (SANS compteur)
export function trendingHashtags(n = 6, city = null) {
  const counts = {};
  S.events.filter(e => e.status !== 'removed' && (!city || e.city === city)).forEach(e => {
    const h = hypeScore(e);
    e.hashtags.forEach(tag => { counts[tag] = (counts[tag] || 0) + h; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
}

// Suggestions de comptes à suivre (pas déjà suivis, même ville en priorité)
export function suggestedUsers(n = 3) {
  const myCity = (S.user && S.user.city) || 'Kinshasa';
  const pool = S.users.filter(u => !(S.follows || []).includes(u.id) && !S.blocked.includes(u.id));
  return pool.sort((a, b) => {
    const ca = (a.city === myCity ? 1 : 0), cb = (b.city === myCity ? 1 : 0);
    return cb - ca || b.followers - a.followers;
  }).slice(0, n);
}

// ———————————————————— Modération / signalements ————————————————————
// Poids du signaleur : compte ancien et fiable pèse plus ; signalements infondés à répétition pèsent moins.
export function reporterWeight() {
  const mine = S.reports.filter(r => r.by === 'me');
  const base = 1;
  const ageBonus = 0; // en production : ancienneté du compte
  const falseReports = mine.filter(r => r.outcome === 'dismissed').length;
  const abusePenalty = Math.min(.8, falseReports * .25);
  const ratePenalty = mine.filter(r => Date.now() - r.ts < 864e5).length >= 5 ? .5 : 0;
  return Math.max(.1, base + ageBonus - abusePenalty - ratePenalty);
}

export function submitReport(targetType, targetId, reason, note) {
  const dup = S.reports.find(r => r.by === 'me' && r.targetType === targetType && r.targetId === targetId);
  if (dup) return { ok: false, code: 'dup' };
  const mine24 = S.reports.filter(r => r.by === 'me' && Date.now() - r.ts < 864e5);
  if (mine24.length >= 10) return { ok: false, code: 'limit' };
  S.reports.push({ id: uid('rep'), by: 'me', targetType, targetId, reason, note, ts: Date.now(), outcome: null });
  save();
  // Vérification (algorithme simulé) : au-dessus d'un seuil de signalements pondérés → on vérifie
  if (targetType === 'event') {
    const evv = ev(targetId);
    if (evv) {
      (evv._reports = evv._reports || []).push({ w: reporterWeight(), reason, ts: Date.now() });
      const weighted = evv._reports.reduce((a, r) => a + r.w, 0);
      const distinctReasons = new Set(evv._reports.map(r => r.reason)).size;
      if (weighted >= 3 && evv.status === 'ok') {
        // Analyse automatisée : motifs répétés + raisons variées = fondé
        const founded = distinctReasons >= 2 || weighted >= 4.5;
        evv.status = founded ? 'removed' : 'limited';
        S.modQueue.push({ id: uid('mq'), evId: evv.id, status: founded ? 'auto-removed' : 'verifying', ts: Date.now() });
        if (founded) queueWebhook('event.removed', { event: evv.id, reason, notifOrg: true });
      }
    }
  }
  save();
  return { ok: true };
}

// File d'attente webhook (structure prête pour branchement ultérieur)
export function queueWebhook(event, payload) {
  S.webhookQueue = S.webhookQueue || [];
  S.webhookQueue.push({ id: uid('wh'), event, payload, ts: Date.now(), sent: false });
  save();
}

export function submitAppeal(evId, text) {
  const ticket = 'CF-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  S.appeals.push({ id: uid('ap'), ticket, evId, text, ts: Date.now(), status: 'open' });
  save();
  return ticket;
}

// ———————————————————— Divers ————————————————————
export function fmtDate(iso, opts) {
  const d = new Date(iso);
  return d.toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'fr-FR', opts || { weekday: 'short', day: 'numeric', month: 'short' });
}
export function fmtTime(iso) { return new Date(iso).toLocaleTimeString(S.lang === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }); }
export function fmtPrice(p) {
  if (!p || !p.on) return t('common.free');
  return `${p.amount} ${p.cur}`;
}
export function relTime(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + ' h';
  return Math.floor(s / 86400) + ' j';
}
export function plural(path, n) {
  // clé avec pluriel « {n} événement | {n} événements »
  const v = t(path);
  const parts = String(v).split('|').map(x => x.trim());
  return (parts.length > 1 && n > 1 ? parts[1] : parts[0]).replaceAll('{n}', n);
}
// Mention de date dynamique : « Ce soir », « Demain », « Dans 12 jours »
export function dateBadge(evv) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(evv.date); const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - now) / 864e5);
  if (diff === 0) return t('common.tonight');
  if (diff === 1) return t('common.tomorrow');
  if (diff > 1) return t('common.inDays', { n: diff });
  return fmtDate(evv.date, { day: 'numeric', month: 'short' });
}
export { uid };
