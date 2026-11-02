# Portfolio Site Scaffold

A one-page scrolling portfolio: static HTML/CSS/JS, no build step.

## Run it locally

This project lives on an iCloud Drive path, which the in-app preview server can't
spawn a process in directly. Run a plain static server from Terminal instead:

```bash
cd "Portfolio Website"
python3 -m http.server 4173
```

Then open http://localhost:4173 in a browser.

Python's `http.server` doesn't send cache-busting headers, so after editing `css/style.css`
or `js/main.js` your browser may keep serving the old cached copy even on a normal reload.
If a change doesn't seem to show up, hard-reload (disable cache in DevTools, or
Cmd+Shift+R) rather than assuming the edit didn't work.

## Structure

```
index.html          all markup, one page, seven sections + nav/footer/modals
css/style.css        all styling, organized by section, responsive breakpoints at bottom
js/main.js            smooth-scroll easing, nav logo↔section-title morph, cursor
                       dot, monotone image hover, contact + project modals
assets/fonts/        drop your custom heading font files here
assets/images/       drop real project/portrait photography here
```

## Things to swap before this is launch-ready

1. ~~**Heading font**~~ — done. Safiro is wired up in `css/style.css` (`@font-face`
   block at the top) across all four weights it ships with (Regular 400, Medium 500,
   Semibold 600, Bold 700) plus italics. `h1`–`h6` default to Bold 700.
2. **Body font** — currently Google Fonts **Lora**, a rounded, classic serif built
   for long-form reading. Loaded via `<link>` in `index.html`. Swap the link + the
   `--font-body` variable in `style.css` if you'd rather use something else
   (Source Serif 4, Fraunces, Spectral are close cousins).
3. **Images** — every image is a placeholder from picsum.photos. Replace `src`
   attributes with your own photography; the monotone→color hover effect needs real
   photos to read well (flat color blocks won't show it).
4. **Logo artwork** — the nav currently uses a text wordmark + dot. Swap `.logo-mark`
   in `index.html`/`style.css` for your actual mark once you have the file.
5. **Contact form** — `js/main.js`'s submit handler is a stub. Wire it to a real
   backend (Formspree, Netlify Forms, a serverless function, etc.) before launch.
6. **Copy** — hero headline, featured/latest project data, about bio, FAQ answers,
   and skills list are all placeholder text to be replaced with the real thing.

## Posting to the Explorations lightbox

Every thumbnail in the Explorations grid (`.explore-gallery` in `index.html`) opens
the lightbox viewer. Each one is a `<div ... data-lightbox>` wrapping a thumbnail
`<img>`; its `data-*` attributes describe what opens.

| Attribute | What it does |
|---|---|
| `data-type` | `image` (default), `video`, or `model` |
| `data-full` | the file to show: a large image, a video, or a `.stl` / `.obj` model |
| `data-title` | bold title in the details box |
| `data-caption` | one line of description under the title |
| `data-details` | up to a few lines separated by `\|`; `Label: value` gets a styled label |
| `data-color` | models only: surface colour (default `#d9d8d4`) |
| `data-up` | models only: `z` or `y`. STL defaults to Z-up (CAD), OBJ to Y-up |
| `data-format` | models only: `stl` or `obj`, when the file has no extension |

The title, caption and details are all optional; the box hides itself when empty.

```html
<!-- Photograph -->
<div class="hover-img reveal" style="--i:0" role="button" tabindex="0" aria-label="Open image 1 of 8"
     data-lightbox data-full="assets/explorations/lake-large.webp"
     data-title="Lake at dawn" data-caption="First light over the water."
     data-details="Camera: Nikon D7000|Lens: 35mm f/1.8|Date: Oct 2026">
  <img src="assets/explorations/lake-thumb.webp" alt="">
</div>

<!-- Video: the thumbnail doubles as the poster; it gets a "VIDEO" badge -->
<div ... data-lightbox data-type="video" data-full="assets/explorations/ride.mp4" data-title="...">
  <img src="assets/explorations/ride-poster.webp" alt="">
</div>

<!-- 3D model: drag to rotate, scroll or pinch to zoom; it gets a "3D" badge -->
<div ... data-lightbox data-type="model" data-full="assets/explorations/bracket.stl" data-title="...">
  <img src="assets/explorations/bracket-render.webp" alt="">
</div>
```

Tips: put files in `assets/explorations/` (the folder doesn't exist yet). Use MP4 (H.264)
for video so it plays everywhere. For the thumbnail of a video or model, export a
still or render. Also update the `aria-label` numbers ("Open image N of M") when you
add or remove thumbnails.

The 3D viewer uses three.js from the jsDelivr CDN (pinned to 0.160.0 in the
`importmap` in `index.html`) and only downloads it the first time a model is opened.
STL files should be reasonably light (a few MB) since they load on click.

## Notes on the interactive bits

- **Smooth scroll**: custom `requestAnimationFrame` easing (easeInOutCubic) driving
  all `[data-scroll]` anchor links — not the CSS `scroll-behavior` property, which
  can't be eased.
- **Nav morph**: an `IntersectionObserver` per section swaps the nav wordmark for
  the in-view section's title once you scroll past the hero.
- **Hero parallax**: the background image drifts at ~12% of scroll speed
  (`parallaxRate` in `main.js`), rAF-throttled. `.hero-bg` is oversized in CSS
  (`top: -15%; height: 130%`) so it has travel room without ever showing an edge;
  the shift is clamped to that overscan — if you raise `parallaxRate` further,
  grow the CSS overscan to match or the clamp will cut the effect short.
  Skipped entirely when the OS-level "reduce motion" preference is on.
- **Cursor dot**: a 30px tinted circle (no border) that tracks the pointer 1:1 —
  no lag or trailing, positioned directly in the `mousemove` handler in
  `main.js`. It activates (fades/scales in) on any element with the
  `.hover-img` class; the fade lives on a nested `.cursor-dot-inner` element so
  it can't reintroduce a position lag.
- **Monotone→color**: any `.hover-img > img` is grayscale by default and desaturates
  to color on hover via a CSS `filter` transition.
