# Gishnu Prasad — Portfolio

Personal portfolio site for Gishnu Prasad, Full-Stack & AI Engineer. Plain HTML, CSS and JS with no build step and no dependencies. Every file sits in this one folder.

| File | What it is |
|---|---|
| `index.html` | The page |
| `style.css` | All styles |
| `main.js` | Scroll animations and interactions |
| `gishnu-cutout.webp` | Hero portrait (background removed) |
| `gishnu-avatar.webp` | Contact-section avatar |
| `gishnu-portrait.jpg` | Social share image (`og:image`) |
| `Gishnu_Prasad_Resume.pdf` | Résumé behind the download buttons |
| `cutout.swift`, `portrait.py` | Tools to rebuild the photos from a new picture |

## Run locally

```bash
python3 -m http.server 4377
```

Then open http://localhost:4377.

## Swap the photo

Needs macOS (for Vision) and Pillow.

```bash
sips -s format png new-photo.jpg --out /tmp/photo.png
swift cutout.swift /tmp/photo.png /tmp/cutout.png
python3 portrait.py /tmp/photo.png /tmp/cutout.png .
```

See the header of `portrait.py` for the avatar crop box and size notes.

## Deploy

Upload the folder to any static host (GitHub Pages, Netlify, Vercel). `cutout.swift` and `portrait.py` aren't used by the site, so you can leave them out.
