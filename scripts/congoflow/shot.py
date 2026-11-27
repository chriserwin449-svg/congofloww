# CongoFlow — captures multi-viewports pour vérification visuelle
import json, sys
from playwright.sync_api import sync_playwright

PAGES = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, cfg in PAGES.items():
        ctx = browser.new_context(
            viewport=cfg.get('vp', {'width': 390, 'height': 844}),
            is_mobile=cfg.get('mobile', False),
            has_touch=cfg.get('mobile', False),
            device_scale_factor=1,
        )
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(String := str(e)[:220]))
        page.goto('file:///home/z/my-project/download/congoflow.html' + cfg.get('hash', ''), wait_until='networkidle')
        page.wait_for_timeout(cfg.get('wait', 1700))
        if cfg.get('scroll'):
            page.evaluate(f"window.scrollTo(0, document.body.scrollHeight * {cfg['scroll']})")
            page.wait_for_timeout(1000)
        if cfg.get('click'):
            for sel in cfg['click']:
                try:
                    page.click(sel, timeout=2500)
                    page.wait_for_timeout(900)
                except Exception as ex:
                    errors.append(f'click {sel}: {str(ex)[:120]}')
        page.screenshot(path=f'/tmp/render/{name}.jpg', type='jpeg', quality=62, full_page=cfg.get('full', False))
        if errors:
            print('ERRORS', name, '||', ' || '.join(errors[:4]))
        ctx.close()
    browser.close()
print('done')
