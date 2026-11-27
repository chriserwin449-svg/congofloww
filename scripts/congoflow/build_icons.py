# CongoFlow — Icônes PWA (logo CongoFlow, PNG 192/512)
from PIL import Image, ImageDraw

def make(size, path):
    bg = (247, 244, 239, 255)
    red = (155, 28, 40, 255)
    ink = (14, 14, 16, 255)
    im = Image.new('RGBA', (size, size), bg)
    d = ImageDraw.Draw(im)
    s = size / 512
    # carte arrondie (éventement d'événement)
    d.rounded_rectangle([96*s, 76*s, 416*s, 400*s], radius=44*s, fill=(255, 253, 249, 255), outline=ink, width=max(3, int(14*s)))
    # bandeau haut rouge
    d.rounded_rectangle([96*s, 76*s, 416*s, 158*s], radius=44*s, fill=red)
    d.rectangle([96*s, 122*s, 416*s, 158*s], fill=red)
    # cœur
    def heart(cx, cy, r, color):
        d.ellipse([cx-r, cy-r*0.9, cx, cy+r*0.35], fill=color)
        d.ellipse([cx, cy-r*0.9, cx+r, cy+r*0.35], fill=color)
        d.polygon([(cx-r*0.96, cy-r*0.05), (cx+r*0.96, cy-r*0.05), (cx, cy+r)], fill=color)
    heart(256*s, 250*s, 74*s, red)
    # lignes texte
    for i, y in enumerate([300*s, 330*s]):
        d.rounded_rectangle([140*s + i*20*s, y, 372*s - i*40*s, y+16*s], radius=8*s, fill=(218, 213, 204, 255))
    # petites étincelles
    d.ellipse([340*s, 170*s, 356*s, 186*s], fill=red)
    im.save(path, 'PNG')
    print('OK', path)

make(192, '/home/z/my-project/scripts/congoflow/images/icon-192.png')
make(512, '/home/z/my-project/scripts/congoflow/images/icon-512.png')
