# CongoFlow — conversion PNG → WebP (recadrages 4:5, 3:2, 9:16) + rapport de tailles
import os
from PIL import Image

SRC = '/home/z/my-project/scripts/congoflow/images'

def convert(name, out, crop_ratio, max_w, q):
    p = os.path.join(SRC, name + '.png')
    if not os.path.exists(p):
        print('MISSING', name); return
    im = Image.open(p).convert('RGB')
    w, h = im.size
    # recadrage centré au ratio demandé
    if w / h > crop_ratio:
        nw = int(h * crop_ratio); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / crop_ratio); y = (h - nh) // 2; im = im.crop((0, y, w, y + nh))
    if im.width > max_w:
        im = im.resize((max_w, int(max_w / crop_ratio)), Image.LANCZOS)
    outp = os.path.join(SRC, out + '.webp')
    im.save(outp, 'WEBP', quality=q, method=6)
    print(f'{out:24s} {im.size} {os.path.getsize(outp)//1024} KB')

posters = ['rumba','club','conf','foot','wax','gospel','gastro','roof']
scenes = ['crowd','friends','dancers','hall']
auths = ['concert','dance','orga','street','culture']

for i in posters: convert('poster-' + i, 'w-poster-' + i, 4/5, 750, 68)
for i in scenes:  convert('scene-' + i,  'w-scene-' + i,  3/2, 960, 60)
for i in auths:
    convert('auth-' + i, 'w-auth-' + i, 3/4, 750, 66)
    convert('auth-' + i, 'w-authm-' + i, 9/16, 562, 62)

total = sum(os.path.getsize(os.path.join(SRC, f)) for f in os.listdir(SRC) if f.endswith('.webp'))
print('TOTAL WEBP:', total // 1024, 'KB')
