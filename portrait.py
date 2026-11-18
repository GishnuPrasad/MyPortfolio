"""Rebuild the portfolio's portrait assets from a new photo.

    sips -s format png new-photo.jpg --out /tmp/photo.png
    swift cutout.swift /tmp/photo.png /tmp/cutout.png
    python3 portrait.py /tmp/photo.png /tmp/cutout.png .

Writes gishnu-cutout.webp (hero), gishnu-avatar.webp (contact) and gishnu-portrait.jpg.
Needs Pillow. The avatar crop box below is tuned to the current photo; adjust AVATAR_BOX for a new one.
If the cutout's size changes, update the width/height on the hero <img> and the aspect-ratio of
.hero__figure in style.css.
"""
import sys
from PIL import Image, ImageFilter, ImageChops, ImageMath

AVATAR_BOX = (398, 62, 858, 522)  # left, top, right, bottom in the original photo

photo_path, cutout_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
cut = Image.open(cutout_path).convert('RGBA')
r, g, b, a = cut.split()

# 1) Pull the matte in ~1px with clean anti-aliasing, so no backdrop fringe survives.
ab = a.filter(ImageFilter.GaussianBlur(1.1))
a2 = ab.point(lambda v: max(0, min(255, int((v / 255 - 0.50) / 0.43 * 255))))

# 2) Take edge colour from the subject's interior (normalised blur), not from the old backdrop.
solid = a.point(lambda v: 255 if v > 251 else 0).filter(ImageFilter.MinFilter(5))
den = solid.filter(ImageFilter.GaussianBlur(3))
near = den.point(lambda v: 255 if v > 5 else 0)
chans = []
for c in (r, g, b):
    num = ImageChops.multiply(c, solid).filter(ImageFilter.GaussianBlur(3))
    ext = ImageMath.unsafe_eval("convert(min(float(n) * 255 / max(float(d), 1), 255), 'L')", n=num, d=den)
    ext = Image.composite(ext, c, near)
    chans.append(Image.composite(c, ext, solid))
fixed = Image.merge('RGBA', (*chans, a2))

left, top, right, _ = cut.getbbox()
box = (max(0, left - 8), max(0, top - 8), min(cut.width, right + 8), cut.height)
hero = fixed.crop(box)
hero.save(f'{out}/gishnu-cutout.webp', quality=92, method=6)

photo = Image.open(photo_path).convert('RGB')
photo.crop(AVATAR_BOX).resize((360, 360), Image.LANCZOS).save(f'{out}/gishnu-avatar.webp', quality=88, method=6)
photo.resize((1000, round(1000 * photo.height / photo.width)), Image.LANCZOS).save(
    f'{out}/gishnu-portrait.jpg', quality=86, optimize=True)
print('hero cutout:', hero.size)
