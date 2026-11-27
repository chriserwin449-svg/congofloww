# CongoFlow — test du parcours utilisateur complet
import sys
from playwright.sync_api import sync_playwright

URL = 'file:///home/z/my-project/download/congoflow.html'
results = []

def ok(label):
    results.append(('✓', label))
    return True

def ko(label, detail=''):
    results.append(('✗', label + (' → ' + str(detail)[:180] if detail else '')))
    return False

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: ko('pageerror', e))

    # 1) Landing → inscription complète
    page.goto(URL, wait_until='networkidle')
    page.evaluate("localStorage.clear()")
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(800)
    page.goto(URL + '#/auth', wait_until='networkidle')
    page.click('[data-mode="signup"]')
    page.wait_for_timeout(400)
    page.fill('#f-name', 'Jean Mbala')
    page.fill('#f-email', 'jean.test@congoflow.cd')
    page.fill('#f-pwd', 'motdepasse123')
    page.fill('#f-pwd2', 'motdepasse123')
    # choisir une ville (Lubumbashi)
    page.click('[data-city="Lubumbashi"]')
    page.click('#authGo')
    page.wait_for_timeout(2400)
    # 2) onboarding 4 questions
    if page.evaluate("location.hash === '#/onboarding'"):
        ok('inscription → onboarding')
        page.click('.ob-cat:nth-child(1)')  # 1 catégorie
        page.click('#obNext')
        page.click('.ob-big:nth-child(1)')  # semaine
        page.click('#obNext')
        page.click('.ob-big:nth-child(1)')  # gratuit
        page.click('#obNext')
        page.click('.ob-big:nth-child(1)')  # participer
        page.click('#obFinish')
        page.wait_for_timeout(900)
    else:
        ko('inscription → onboarding', page.evaluate('location.hash'))
    # 3) confirmation de ville
    try:
        txt = page.evaluate("document.body.textContent.includes('Lubumbashi')")
        if txt:
            page.click('#ccYes', timeout=2500)
            page.wait_for_timeout(800)
            ok('confirmation ville (Lubumbashi)')
        else:
            ko('confirmation ville', 'texte ville introuvable')
    except Exception as e:
        ko('confirmation ville', str(e)[:100])
    # 4) tutoriel à la 1re visite du fil
    try:
        page.click('#tutSkip', timeout=3000)
        ok('tutoriel affiché à la 1re création de compte')
        page.wait_for_timeout(500)
    except Exception:
        ko('tutoriel à la 1re création', 'non affiché')
    # 5) le fil priorise Lubumbashi
    city = page.evaluate("""(() => {
      const t = document.querySelector('.feed-title');
      return t ? t.textContent : 'MISSING';
    })()""")
    ('Lubumbashi' in str(city)) and ok('fil priorise la ville (titre: ' + str(city).strip()[:40] + ')') or ko('fil priorise la ville', city)
    # 6) like une carte via le bouton cœur
    first_title = page.evaluate("document.querySelector('.evp-title')?.textContent || 'MISSING'")
    page.click('#btnLike')
    page.wait_for_timeout(1200)
    liked = page.evaluate("JSON.parse(localStorage.getItem('congoflow_v1')).myLikes.length")
    (liked and ok('like via bouton cœur (1er: ' + str(first_title).strip()[:30] + ')')) or ko('like via bouton', 'myLikes=' + str(liked))
    # 7) Mes événements contient le like
    page.goto(URL + '#/app/mine', wait_until='networkidle')
    page.wait_for_timeout(900)
    n = page.evaluate("document.querySelectorAll('.mine-item').length")
    (n > 0 and ok('Mes événements affiche ' + str(n) + ' événement(s) aimé(s)')) or ko('Mes événements', 'n=' + str(n))
    # 8) publier un événement
    page.goto(URL + '#/app/publish', wait_until='networkidle')
    page.wait_for_timeout(800)
    # injecter une image de test 4:5 directement dans le store (l'input fichier
    # dynamique n'est pas pilotable de façon fiable en headless)
    page.evaluate("""(() => {
      const cv = document.createElement('canvas'); cv.width = 750; cv.height = 937;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#9B1C28'; cx.fillRect(0, 0, 750, 937);
      cx.fillStyle = '#F7F4EF'; cx.font = 'bold 80px sans-serif'; cx.fillText('TEST', 220, 500);
      const img = cv.toDataURL('image/jpeg', .8);
      // stocker pour que renderPublish la lise : on simule via le draft persisté
      const s = JSON.parse(localStorage.getItem('congoflow_v1'));
      window.__pubImg = img;
      return true;
    })()""")
    ok('image de test 4:5 générée')
    page.fill('#p-title', 'Soirée test de Jean à Lubumbashi')
    # l'affiche est obligatoire : injecter un brouillon complet dans le store
    # puis RECHARGER la page (le store applicatif est en mémoire)
    page.evaluate("""(() => {
      const cv = document.createElement('canvas'); cv.width = 750; cv.height = 937;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#9B1C28'; cx.fillRect(0, 0, 750, 937);
      cx.fillStyle = '#F7F4EF'; cx.font = 'bold 80px sans-serif'; cx.fillText('TEST', 220, 500);
      const img = cv.toDataURL('image/jpeg', .8);
      const s = JSON.parse(localStorage.getItem('congoflow_v1'));
      const d = new Date(); d.setDate(d.getDate() + 5);
      s.events.unshift({
        id: 'mev_test', img, category: 'party',
        price: { on: true, amount: 5, cur: 'USD' },
        allowComments: true, showLikes: true, allowMessages: true,
        title: 'Soirée test de Jean à Lubumbashi', sub: '',
        desc: 'Une soirée de test organisée par Jean à Lubumbashi.', program: '', practical: '',
        date: d.toISOString(), time: '19:30', city: 'Lubumbashi', commune: 'Golf', area: 'Golf', addr: 'Avenue test',
        hashtags: ['test'], status: 'draft', organizer: s.user.id,
        stats: { views: 12, likes: 0, comments: 0, shares: 0, saves: 0, boosts: 0 }, ts: Date.now(),
      });
      localStorage.setItem('congoflow_v1', JSON.stringify(s));
      return true;
    })()""")
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(900)
    page.goto(URL + '#/app/publish/mev_test', wait_until='networkidle')
    page.wait_for_timeout(1000)
    title_ok = page.evaluate("(document.querySelector('#p-title')?.value || '').includes('Soirée test')")
    (title_ok and ok('brouillon avec affiche chargé dans l éditeur (édition)')) or ko('éditeur brouillon', 'titre vide')
    page.click('#pubNext')  # → étape 2
    page.wait_for_timeout(400)
    page.click('#pubNext')  # → étape 3 (description déjà remplie)
    page.wait_for_timeout(400)
    page.click('#pubNext')  # → étape 4
    page.wait_for_timeout(400)
    page.click('#pubNext')  # publier
    page.wait_for_timeout(1500)
    published = page.evaluate("JSON.parse(localStorage.getItem('congoflow_v1')).events.some(e => e.id === 'mev_test' && e.status === 'ok')")
    (published and ok('événement publié')) or ko('publication', 'statut: ' + str(page.evaluate("JSON.parse(localStorage.getItem('congoflow_v1')).events.find(e => e.id === 'mev_test')?.status")))
    # 9) profil : le post apparaît dans la grille
    page.goto(URL + '#/app/profile', wait_until='networkidle')
    page.wait_for_timeout(1600)
    grid = page.evaluate("document.querySelectorAll('.pg-item').length")
    (grid > 0 and ok('profil: grille affiche ' + str(grid) + ' post(s)')) or ko('profil grille', 'n=' + str(grid))
    # 10) paramètres : sections + revoir tutoriel
    try:
        page.click('#pcSet', timeout=6000)
    except Exception:
        # retry après re-rendu
        page.wait_for_timeout(1500)
        page.click('#pcSet', timeout=6000)
    page.wait_for_timeout(900)
    secs = page.evaluate("document.querySelectorAll('.set-sec').length")
    (secs >= 8 and ok('paramètres: ' + str(secs) + ' sections')) or ko('paramètres sections', 'n=' + str(secs))
    # 11) déconnexion avec confirmation
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.click('#sLogout')
    page.wait_for_timeout(600)
    page.click('#loYes')
    page.wait_for_timeout(800)
    (page.evaluate("location.hash === '#/'")) and ok('déconnexion → landing') or ko('déconnexion', page.evaluate('location.hash'))

    # 12) RECONNEXION (le tutoriel ne doit PAS réapparaître) — délai de grâce testé
    page.goto(URL + '#/auth', wait_until='networkidle')
    page.wait_for_timeout(600)
    # le compte vient d'être créé : le login re-crée (démo) → vérifier le comportement du tuto sur le store existant
    page.fill('#f-email', 'jean.test@congoflow.cd')
    page.fill('#f-pwd', 'motdepasse123')
    page.click('#authGo')
    page.wait_for_timeout(2400)
    tut = page.evaluate("!!document.querySelector('#tutSkip')")
    (not tut and ok('reconnexion : tutoriel NON réaffiché')) or ko('reconnexion tuto', 'réaffiché')
    # 13) suppression de compte : 3 pages
    page.goto(URL + '#/app/profile', wait_until='networkidle')
    page.wait_for_timeout(900)
    page.click('#pcSet')
    page.wait_for_timeout(700)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.click('#sDelete')
    page.wait_for_timeout(800)
    # page 1
    p1 = page.evaluate("!!document.querySelector('.del-flow')")
    (p1 and ok('suppression page 1 (confirmation + conséquences + grâce 30j)')) or ko('suppression p1', 'absente')
    grace = page.evaluate("document.body.textContent.includes('30')")
    (grace and ok('délai de grâce 30 jours affiché')) or ko('grâce 30j', 'non mentionné')
    page.click('#d1Yes')
    page.wait_for_timeout(700)
    # page 2 : raison
    page.click('.rep-opt[data-r="0"]')
    page.click('#d2Next')
    page.wait_for_timeout(700)
    # page 3 : recopier le nom d'utilisateur
    username = page.evaluate("JSON.parse(localStorage.getItem('congoflow_v1')).user.username")
    btn_disabled = page.evaluate("document.querySelector('#d3Go').disabled")
    (btn_disabled and ok('bouton suppression désactivé sans saisie exacte')) or ko('bouton désactivé', 'actif')
    page.fill('#d3Input', 'mauvais-nom')
    err_shown = page.evaluate("document.querySelector('#d3Err').classList.contains('show')")
    (err_shown and ok('aide douce en cas d erreur')) or ko('aide erreur', 'non affichée')
    page.fill('#d3Input', username)
    page.wait_for_timeout(300)
    btn_enabled = page.evaluate("!document.querySelector('#d3Go').disabled")
    (btn_enabled and ok('bouton activé avec le bon nom')) or ko('bouton activé', 'toujours désactivé')
    page.click('#d3Go')
    page.wait_for_timeout(1500)
    # écran d'au revoir puis retour landing
    goodbye = page.evaluate("!!document.querySelector('.del-goodbye')")
    (goodbye and ok('écran d au revoir affiché')) or ko('au revoir', 'absent')
    page.wait_for_timeout(3000)
    (page.evaluate("location.hash === '#/'") and ok('retour à la landing après suppression')) or ko('retour landing', page.evaluate('location.hash'))
    cleared = page.evaluate("!localStorage.getItem('congoflow_v1')")
    (cleared and ok('données locales effacées')) or ko('données locales', 'présentes')

    ctx.close()
    b.close()

print('=== PARCOURS (' + str(sum(1 for s, _ in results if s == '✓')) + '/' + str(len(results)) + ') ===')
for s, label in results:
    print(' ', s, label)
