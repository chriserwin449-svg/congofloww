// CongoFlow — Build : assemble un unique congoflow.html autonome
// - Bundle des modules ES (ordre explicite, imports retirés)
// - Polices WOFF2 + images WebP inlinées en base64
// - Icônes PWA générées en PNG base64 (logo)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC = '/home/z/my-project/scripts/congoflow/src';
const IMG = '/home/z/my-project/scripts/congoflow/images';
const FONTS = '/home/z/my-project/scripts/congoflow/fonts';
const OUT = '/home/z/my-project/download/congoflow.html';

// ————— 1. Bundle JS —————
const files = ['core.js', 'landing.js', 'auth.js', 'feed.js', 'publish.js', 'pages.js', 'search.js', 'app.js'];

// dictionnaires i18n : « export default » doit garder un nom de variable
const i18nRenames = { 'i18n/fr.js': 'const I18N =', 'i18n/en.js': 'const I18N_EN =', 'i18n/ln.js': 'const I18N_LN =' };

let js = '';
for (const f of ['i18n/fr.js', 'i18n/en.js', 'i18n/ln.js', 'data/cities.js', 'data/demo.js']) {
  let code = fs.readFileSync(path.join(SRC, f), 'utf8');
  code = code.replace(/^import\s+[^;]+;?\s*$/gm, '');
  code = code.replace(/^export\s+default\s+/m, i18nRenames[f] || 'const __x =');
  code = code.replace(/^export\s+(default\s+)?/gm, '');
  js += `\n/* ==================== ${f} ==================== */\n` + code + '\n';
}
for (const f of files) {
  let code = fs.readFileSync(path.join(SRC, f), 'utf8');
  // retire les imports (dépendances déjà chargées avant, ordre explicite)
  code = code.replace(/^import\s+[^;]+;?\s*$/gm, '');
  // retire les exports
  code = code.replace(/^export\s+(default\s+)?/gm, '');
  js += `\n/* ==================== ${f} ==================== */\n` + code + '\n';
}
// les imports dynamiques -> appels directs (modules déjà présents)
js = js.replace(/import\('\.\/feed\.js'\)\.then\(m\s*=>\s*m\.([^)]+)\)/g, '$1');
js = js.replace(/import\('\.\/core\.js'\)\.then\(m\s*=>\s*m\.([^)]+)\)/g, '$1');

// ————— 2. CSS —————
const cssFiles = ['theme.css', 'landing.css', 'auth.css', 'feed.css', 'publish.css', 'pages.css', 'app.css'];
let css = cssFiles.map(f => fs.readFileSync(path.join(SRC, 'css', f), 'utf8')).join('\n');
const b64 = f => fs.readFileSync(f).toString('base64');

// polices (typographie copiée de trendsaas.ai : Bricolage Grotesque + Instrument Sans + Spline Sans Mono)
const fontFace = (fam, weight, file, style = 'normal') =>
  `@font-face{font-family:'${fam}';font-weight:${weight};font-style:${style};src:url(data:font/woff2;base64,${b64(path.join(FONTS, file))}) format('woff2');font-display:swap;}`;
let fontCss = '';
fontCss += fontFace('Bricolage Grotesque', 400, 'bg-regular.woff2');
fontCss += fontFace('Bricolage Grotesque', 500, 'bg-500.woff2');
fontCss += fontFace('Bricolage Grotesque', 600, 'bg-600.woff2');
fontCss += fontFace('Bricolage Grotesque', 700, 'bg-700.woff2');
fontCss += fontFace('Bricolage Grotesque', 800, 'bg-800.woff2');
fontCss += fontFace('Instrument Sans', 400, 'is-regular.woff2');
fontCss += fontFace('Instrument Sans', 500, 'is-500.woff2');
fontCss += fontFace('Instrument Sans', 600, 'is-600.woff2');
fontCss += fontFace('Instrument Sans', 700, 'is-700.woff2');
fontCss += fontFace('Spline Sans Mono', 400, 'ss-regular.woff2');
fontCss += fontFace('Spline Sans Mono', 500, 'ss-500.woff2');
// Instrument Serif italique conservée pour les accents éditoriaux (un mot-clé par titre)
const serifFile = path.join(FONTS, 'serif-italic.woff2');
if (fs.existsSync(serifFile)) fontCss += fontFace('Instrument Serif', 400, 'serif-italic.woff2', 'italic');

// ————— 3. Images base64 —————
const webpIds = fs.readdirSync(IMG).filter(f => f.endsWith('.webp')).map(f => f.replace('.webp', ''));
let imgs = '';
for (const id of webpIds) {
  imgs += `CF_IMG['${id}']='data:image/webp;base64,${b64(path.join(IMG, id + '.webp'))}';\n`;
}
// logos officiels (PNG transparents : ink / cream / red)
for (const lg of ['logo-ink', 'logo-cream', 'logo-red']) {
  const p = path.join(IMG, lg + '.png');
  if (fs.existsSync(p)) imgs += `CF_IMG['${lg}']='data:image/png;base64,${b64(p)}';\n`;
}

// ————— 4. Icônes PWA (PNG base64, générées via canvas headless -> utilise un PNG simple du disque) —————
// On génère les icônes avec Python PIL séparément (build_icons.py) ; ici on les lit.
let icon192 = '', icon512 = '';
const p192 = path.join(IMG, 'icon-192.png'), p512 = path.join(IMG, 'icon-512.png');
if (fs.existsSync(p192)) icon192 = `data:image/png;base64,${b64(p192)}`;
if (fs.existsSync(p512)) icon512 = `data:image/png;base64,${b64(p512)}`;

// ————— 5. HTML final —————
const iconData = icon192 || 'data:,';
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#9B1C28">
<meta name="description" content="CongoFlow — Ta ville bouge, suis le flow. Découvre, aime et publie les événements de Kinshasa, Lubumbashi, Goma, Boma et tout le Congo. Gratuit.">
<meta name="keywords" content="événements Congo, Kinshasa, sorties, concerts, soirées, RDC, agenda">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CongoFlow">
<meta property="og:title" content="CongoFlow — Ta ville bouge. Suis le flow.">
<meta property="og:description" content="Swipe, aime et sors. Les événements de ta ville au même endroit, et publie les tiens en quelques minutes.">
<meta property="og:image" content="${iconData}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="CongoFlow — Ta ville bouge. Suis le flow.">
<meta name="twitter:description" content="Les événements du Congo, au même endroit.">
<title>CongoFlow — Ta ville bouge. Suis le flow.</title>
<link rel="icon" href="${iconData}">
<link rel="apple-touch-icon" href="${icon512 || iconData}">
<style>
${fontCss}
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
// Images inline (WebP + icônes PNG, base64)
const CF_IMG = {};
${imgs}
${icon192 ? `CF_IMG['icon-192']='${icon192}';` : ''}
${icon512 ? `CF_IMG['icon-512']='${icon512}';` : ''}
</script>
<script>
${js}
boot();
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log('OK ->', OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(2), 'MB');
console.log('images inline:', webpIds.length, '| icon192:', !!icon192, '| icon512:', !!icon512);
