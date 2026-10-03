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
