# CongoFlow — audit de contraste WCAG des textes (≥ 4.5:1)
from playwright.sync_api import sync_playwright

URL = 'file:///home/z/my-project/download/congoflow.html'

def lum(r, g, b):
    def f(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(c1, c2):
    l1, l2 = lum(*c1), lum(*c2)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

def parse_rgb(s):
    s = s.replace('rgba(', '').replace('rgb(', '').replace(')', '')
    parts = [float(x) for x in s.split(',')]
    return (int(parts[0]), int(parts[1]), int(parts[2])), (parts[3] if len(parts) > 3 else 1)

with sync_playwright() as p:
    b = p.chromium.launch()
    bad = []
    total = 0
    for route, vp in [('#/', {'width': 390, 'height': 844}), ('#/auth', {'width': 390, 'height': 844}), ('#/app/feed', {'width': 1440, 'height': 900})]:
        ctx = b.new_context(viewport=vp)
        page = ctx.new_page()
        page.goto(URL, wait_until='networkidle')
        page.evaluate("localStorage.clear()")
        if route != '#/':
            page.goto(URL + '#/auth', wait_until='networkidle')
            page.fill('#f-email', 'demo@congoflow.cd')
            page.fill('#f-pwd', 'demo1234')
            page.click('#authGo')
            page.wait_for_timeout(2400)
            try:
                page.click('#tutSkip', timeout=2000)
            except Exception:
                pass
            page.wait_for_timeout(600)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(400)
        results = page.evaluate("""(() => {
          const out = [];
          const els = document.querySelectorAll('p, span, a, button, label, h1, h2, h3, h4, small, strong, dt, dd, .t-small, .t-body');
          for (const el of els) {
            const r = el.getBoundingClientRect();
            if (r.width < 3 || r.height < 3) continue;
            const st = getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
            if (!el.textContent.trim()) continue;
            let bg = 'rgba(0,0,0,0)', node = el;
            while (node && node !== document.documentElement) {
              const s2 = getComputedStyle(node);
              if (s2.backgroundColor && s2.backgroundColor !== 'rgba(0, 0, 0, 0)') { bg = s2.backgroundColor; break; }
              if (s2.backgroundImage && s2.backgroundImage !== 'none') { bg = 'image'; break; }
              node = node.parentElement;
            }
            out.push({ text: el.textContent.trim().slice(0, 30), color: st.color, bg, fs: st.fontSize, sel: el.tagName + '.' + (el.className || '').toString().split(' ')[0] });
          }
          return out.slice(0, 400);
        })()""")
        for item in results:
            if item['bg'] == 'image':
                continue  # fond image : non mesurable ici
            (r, g, bl), a = parse_rgb(item['color'])
            (br, bg_, bb), ba = parse_rgb(item['bg']) if item['bg'] != 'rgba(0,0,0,0)' else ((247, 244, 239), 1)
            if a < 1:
                # composite sur le fond
                r, g, bl = int(r * a + br * (1 - a)), int(g * a + bg_ * (1 - a)), int(bl * a + bb * (1 - a))
            cr = ratio((r, g, bl), (br, bg_, bb))
            total += 1
            # texte < 18.66px bold ou < 24px : 4.5:1 exigé
            fs = float(item['fs'].replace('px', ''))
            is_bold = 'bold' in item.get('sel', '') or item['sel'].startswith(('h1', 'h2', 'h3', 'h4', 'strong'))
            need = 3.0 if (fs >= 24 or (fs >= 18.66 and is_bold)) else 4.5
            if cr < need:
                bad.append((route, item['sel'], item['text'], round(cr, 2), 'need ' + str(need)))
        ctx.close()
    b.close()

print(f'Textes mesurés : {total}')
if bad:
    print(f'SOUS LE SEUIL ({len(bad)}) :')
    seen = set()
    for route, sel, text, cr, need in bad:
        key = (sel, cr)
        if key in seen: continue
        seen.add(key)
        print(f'  {cr}:1 {sel} "{text}" {need} ({route})')
else:
    print('TOUS LES TEXTES ≥ 4.5:1 (ou 3:1 grand texte) ✓')
