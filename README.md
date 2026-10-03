# Subhash Kapoor: Portfolio

Personal portfolio for Subhash Kapoor, Design Manager and Product Design Leader.

A single static page (`index.html`, no build step). The hero is a 3D cartoon intro video with its background removed in the browser: `media/hero.mp4` stores the colour on the left half and a matte on the right half, and a small WebGL shader combines them.

## Run locally

    python3 -m http.server 8000

Then open http://localhost:8000. Use a local server rather than opening the file directly so the video can load.

## Structure

    index.html          page, styles and scripts
    img/                portrait cut-out, ID-card headshot, poster frame
    media/hero.mp4      intro video (colour | matte, side by side)

## Deploy

Works on GitHub Pages (Settings, Pages, deploy from `main`), Netlify or Vercel as-is.
