// CongoFlow — Core : store persistant, hype, recommandation, modération, PWA
import { demoEvents, demoUsers, demoNotifications, demoConversations, demoHashtagPool } from './data/demo.js';
import I18N from './i18n/fr.js';
import I18N_EN from './i18n/en.js';
import I18N_LN from './i18n/ln.js';

export const I18N_DICTS = { fr: I18N, en: I18N_EN, ln: I18N_LN };

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
    seenIntro: false,   // tutoriel du fil
    onboarding: null,   // réponses aux 5 questions
    settings: { notifLikes: true, notifFollows: true, notifReminders: true, privateLikes: false },
    hypeLog: {},        // evId -> timestamps d'activité (pour récence)
  };
}

let S = null;
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { S = JSON.parse(raw); return; }
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
  const missing = demoIds.filter(id => !S.events.some(e => e.id === id));
  if (!S.events.length || (missing.length && !S.events.some(e => e.organizer === 'me'))) {
    const existing = S.events.filter(e => e.organizer === 'me' || !demoIds.includes(e.id));
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

// ———————————————————— Hype ————————————————————
// vues×1, likes×3, commentaires×4, enregistrements×5, partages×6, boosts×8
// × facteur de récence (activité récente compte plus) × facteur de proximité de la date
export function hypeScore(ev, now = Date.now()) {
  const s = ev.stats || {};
  const base = (s.views || 0) * 1 + (s.likes || 0) * 3 + (s.comments || 0) * 4
    + (s.saves || 0) * 5 + (s.shares || 0) * 6 + (s.boosts || 0) * 8;
  // récence de l'activité : pics récents pèsent plus (décroissance sur 14 jours)
  const log = S.hypeLog[ev.id] || [];
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
// Apprend : likes, passes, boosts, temps passé, hashtags consultés, onboarding, zone géo, proximité date.
export function feedOrder() {
  const now = Date.now();
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

  const pool = S.events.filter(e => e.status === 'ok' && !S.myLikes.includes(e.id) && !S.myPasses.includes(e.id) && new Date(e.date) > new Date(now));
  return pool.map(e => {
    let sc = 0;
    sc += (catScore[e.category] || 0) * 3;
    e.hashtags.forEach(h => { sc += (tagScore[h] || 0) * 2; });
    sc += areaScore[e.area] || 0;
    sc += hypeLevel(hypeScore(e)) * 4;                 // hype forte = plus visible
    const daysTo = (new Date(e.date) - now) / 864e5;   // proximité de la date
    sc += daysTo < 3 ? 10 : daysTo < 7 ? 6 : daysTo < 14 ? 3 : 0;
    sc += Math.random() * 3;                            // légère variation (diversité)
    return { e, sc };
  }).sort((a, b) => b.sc - a.sc).map(x => x.e);
}

export function ev(id) { return S.events.find(e => e.id === id); }
export function userById(id) { return id === (S.user && S.user.id) ? S.user : S.users.find(u => u.id === id); }

// Avatar HTML : photo de profil si présente, sinon initiales sur fond couleur
export function avatarHTML(u, cls = '') {
  if (!u) return `<span class="ev-avatar ${cls}">?</span>`;
  if (u.photo) return `<span class="ev-avatar has-photo ${cls}" style="background:${u.color || '#9B1C28'}"><img src="${u.photo}" alt=""></span>`;
  return `<span class="ev-avatar ${cls}" style="background:${u.color || '#0E0E10'}">${(u.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('')}</span>`;
}

// Tendances : hashtags des événements avec la plus forte hype
export function trendingHashtags(n = 6) {
  const counts = {};
  S.events.filter(e => e.status !== 'removed').forEach(e => {
    const h = hypeScore(e);
    e.hashtags.forEach(tag => { counts[tag] = (counts[tag] || 0) + h; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
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
        // Webhook prévu pour être branché plus tard (structure de données) :
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
export { uid };
