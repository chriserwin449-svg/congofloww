# CongoFlow — audit DOM automatisé multi-viewports
# Vérifie : débordement horizontal, visibilité des éléments clés, chevauchement dock/contenu,
# hauteur de la carte dans l'écran, cohérences fonctionnelles (onglets, boutons, compteurs).
import sys
from playwright.sync_api import sync_playwright

URL = 'file:///home/z/my-project/download/congoflow.html'
issues = []
oks = []

def ok(label):
    oks.append(label)

def ko(label, detail=''):
    issues.append(label + (': ' + str(detail)[:160] if detail else ''))

def check(label, fn):
    try:
        r = fn()
        if r is True:
            ok(label)
        else:
            ko(label, r)
    except Exception as e:
        ko(label, 'EXC ' + str(e)[:140])

JS_VISIBLE = """(() => {
  const el = document.querySelector(SELR);
  if (!el) return 'MISSING';
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return 'too small';
  const st = getComputedStyle(el);
  if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) return 'invisible';
  return true;
})()"""

def visible(page, sel):
    return page.evaluate(JS_VISIBLE.replace('SELR', "'" + sel + "'"))

def no_hoverflow(page):
    sw = page.evaluate('document.documentElement.scrollWidth')
    iw = page.evaluate('window.innerWidth')
    return True if sw <= iw + 1 else f'scrollW={sw} > innerW={iw}'

def js(page, code):
    return page.evaluate(code)

VIEWPORTS = [
    ('m360', {'width': 360, 'height': 640}, True),
    ('m390', {'width': 390, 'height': 844}, True),
    ('m412', {'width': 412, 'height': 915}, True),
    ('d1366x640', {'width': 1366, 'height': 640}, False),
    ('d1440', {'width': 1440, 'height': 900}, False),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    for vname, vp, mobile in VIEWPORTS:
        ctx = browser.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile)
        page = ctx.new_page()
        page.on('pageerror', lambda e: issues.append(f'{vname} PAGEERROR: ' + str(e)[:180]))
        page.goto(URL, wait_until='networkidle')
        page.wait_for_timeout(1500)

        # ——— Landing ———
        check(f'{vname} landing: pas de débordement H', lambda: no_hoverflow(page))
        for sel in ['.lnav', '#hero .t-display', '.hero-phone', '.hero-ctas .btn-primary', '#manifesto', '#features .benefit:nth-child(1)']:
            check(f'{vname} landing visible {sel}', lambda s=sel: visible(page, s))
        check(f'{vname} largeur téléphone', lambda: js(page, """(() => {
          const ph = document.querySelector('.hero-phone'); if (!ph) return 'MISSING';
          const ratio = ph.getBoundingClientRect().width / window.innerWidth;
          if (window.innerWidth < 700 && (ratio < 0.5 || ratio > 0.9)) return 'ratio=' + ratio.toFixed(2);
          return true; })()"""))

        # ——— Inscription : carte + ville ———
        page.goto(URL + '#/auth', wait_until='networkidle')
        page.wait_for_timeout(800)
        try:
            page.click('[data-mode="signup"]', timeout=2000)
            page.wait_for_timeout(400)
            check(f'{vname} signup: carte visible', lambda: visible(page, '#authCard'))
            check(f'{vname} signup: question ville', lambda: visible(page, '#cityPick'))
            check(f'{vname} signup: pas de débordement', lambda: no_hoverflow(page))
        except Exception as e:
            ko(f'{vname} signup toggle', str(e)[:100])

        # ——— Connexion démo → fil ———
        page.click('[data-mode="login"]')   # revenir en mode connexion
        page.wait_for_timeout(400)
        page.fill('#f-email', 'demo@congoflow.cd')
        page.fill('#f-pwd', 'demo1234')
        page.click('#authGo')
        page.wait_for_timeout(2800)
        # tutoriel : le fermer
        try:
            page.click('#tutSkip', timeout=2500)
            page.wait_for_timeout(400)
            ok(f'{vname} tutoriel affiché puis fermé (1re connexion)')
        except Exception:
            ok(f'{vname} tutoriel non affiché (déjà vu)')
        check(f'{vname} fil: pas de débordement', lambda: no_hoverflow(page))
        for sel in ['.app-dock', '.app-dock .dock-add', '.feed-actions', '#cardStack .ev-poster', '.evp-rail .rail-btn', '.cat-row .cat-pill', '#feedTabs']:
            check(f'{vname} fil visible {sel}', lambda s=sel: visible(page, s))
        check(f'{vname} dock: 5 cellules', lambda: js(page, "document.querySelectorAll('.app-dock .dock-cell').length === 5 ? true : 'n=' + document.querySelectorAll('.app-dock .dock-cell').length"))
        check(f'{vname} boutons au-dessus du dock', lambda: js(page, """(() => {
          const fa = document.querySelector('.feed-actions'); const dock = document.querySelector('.app-dock');
          if (!fa || !dock) return 'MISSING';
          return fa.getBoundingClientRect().bottom <= dock.getBoundingClientRect().top + 2 ? true : 'overlap';
        })()"""))
        check(f'{vname} carte tient dans l écran', lambda: js(page, """(() => {
          const c = document.querySelector('#cardStack .ev-poster'); if (!c) return 'MISSING';
          const r = c.getBoundingClientRect();
          return (r.bottom <= window.innerHeight - 50) ? true : 'bottom=' + Math.round(r.bottom) + ' vh=' + window.innerHeight;
        })()"""))
        check(f'{vname} rail dans la carte', lambda: js(page, """(() => {
          const rail = document.querySelector('.evp-rail'); const card = document.querySelector('#cardStack .ev-poster');
          if (!rail || !card) return 'MISSING';
          const rr = rail.getBoundingClientRect(), cr = card.getBoundingClientRect();
          return (rr.right <= cr.right + 2) ? true : 'rail dépasse';
        })()"""))
        check(f'{vname} salutation personnalisée', lambda: js(page, """(() => {
          const g = document.querySelector('#feedGreet'); if (!g) return 'MISSING';
          return g.textContent.trim().length > 3 ? true : 'vide';
        })()"""))

        # ——— Profil ———
        page.goto(URL + '#/app/profile', wait_until='networkidle')
        page.wait_for_timeout(1100)
        check(f'{vname} profil: pas de débordement', lambda: no_hoverflow(page))
        for sel in ['.prof-cover', '.prof-avatar', '.prof-stats3 .ps3', '.prof-hype', '#profTabs']:
            check(f'{vname} profil visible {sel}', lambda s=sel: visible(page, s))

        # ——— Paramètres ———
        try:
            page.click('#pcSet', timeout=2500)
            page.wait_for_timeout(900)
            check(f'{vname} paramètres: pas de débordement', lambda: no_hoverflow(page))
            for sel in ['#langSet', '.switch', '#sLogout', '#sDelete']:
                check(f'{vname} paramètres visible {sel}', lambda s=sel: visible(page, s))
            check(f'{vname} paramètres: sections', lambda: js(page, "document.querySelectorAll('.set-sec').length >= 8 ? true : 'n=' + document.querySelectorAll('.set-sec').length"))
        except Exception as e:
            ko(f'{vname} settings open', str(e)[:100])

        # ——— Recherche ———
        page.goto(URL + '#/app/search', wait_until='networkidle')
        page.wait_for_timeout(900)
        check(f'{vname} recherche: pas de débordement', lambda: no_hoverflow(page))
        check(f'{vname} recherche: 3 onglets', lambda: js(page, "(() => { const t = document.querySelectorAll('#srTabs button'); return t.length === 3 ? true : 'n=' + t.length; })()"))

        # ——— Page hashtag ———
        page.goto(URL + '#/tag/rumba', wait_until='networkidle')
        page.wait_for_timeout(900)
        check(f'{vname} hashtag: pas de débordement', lambda: no_hoverflow(page))
        check(f'{vname} hashtag: bouton favori', lambda: visible(page, '#tagFav'))
        check(f'{vname} hashtag: grille', lambda: js(page, "document.querySelectorAll('.tg-item').length > 0 ? true : 'empty'"))
        check(f'{vname} hashtag: zéro compteur', lambda: js(page, """(() => {
          const h = document.querySelector('.tag-hero'); if (!h) return 'MISSING hero';
          const t = h.textContent.replace('#', '');
          return /\\d/.test(t) ? 'chiffres: ' + t.trim().slice(0, 50) : true;
        })()"""))

        # ——— Publier : ville à l'étape 1 ———
        page.goto(URL + '#/app/publish', wait_until='networkidle')
        page.wait_for_timeout(900)
        check(f'{vname} publier: ville étape 1', lambda: visible(page, '#p-city'))

        ctx.close()
    browser.close()

print('=== OK (' + str(len(oks)) + ') ===')
for o in oks:
    print('  ✓', o)
print('=== PROBLÈMES (' + str(len(issues)) + ') ===')
for i in issues:
    print('  ✗', i)
