# CongoFlow — déclinaisons du logo officiel (uploadé) pour intégration inline
from PIL import Image, ImageDraw

SRC = '/home/z/my-project/upload/Logo CongoFlow – 25 Nov 2026, 6.22 pm.png'
OUT = '/home/z/my-project/images'
import os
OUT = '/home/z/my-project/scripts/congoflow/images'

src = Image.open(SRC).convert('RGBA')
crop = src.crop((204, 228, 1044, 1068))  # bbox du contenu (analysée)

def recolor(logo, color):
    """Remplace l'encre noire par une couleur unie, fond transparent (garde l'antialiasing)."""
    im = logo.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if lum < 250:
                px[x, y] = (*color, int(a * (1 - lum / 255)))
            else:
                px[x, y] = (0, 0, 0, 0)
    return im

def with_pad(im, ratio=0.06):
    pad = int(max(im.size) * ratio)
    canvas = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, (pad, pad), im)
    return canvas

# versions couleur (400px suffit pour un affichage ≤ 60px de haut)
for name, color in [('logo-ink', (14, 14, 16)), ('logo-cream', (247, 244, 239)), ('logo-red', (155, 28, 40))]:
    im = with_pad(recolor(crop, color))
    im.thumbnail((400, 400), Image.LANCZOS)
    im.save(f'{OUT}/{name}.png', optimize=True)
    print('OK', name, im.size)

# Icônes PWA : logo blanc cassé sur carré arrondi rouge sombre
for size in (192, 512):
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)
    bg.paste(Image.new('RGBA', (size, size), (155, 28, 40, 255)), (0, 0), mask)
    mark = recolor(crop, (247, 244, 239))
    mark.thumbnail((int(size * 0.72), int(size * 0.72)), Image.LANCZOS)
    bg.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    bg.convert('RGB').save(f'{OUT}/icon-{size}.png', optimize=True)
    print('OK icon', size)
