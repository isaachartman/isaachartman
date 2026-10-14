# Portfolio website: working notes

Summary of the Oct 11–14, 2026 working session, so a new chat can pick up from here. Not part of the site: do not commit this file if the repo root is deployed as the web root (it would be served publicly). It is currently untracked.

## Where things are

- **Repo:** `Work/Sites/portfolio-website` (it was `Work/Portfolio/portfolio-website` earlier; it moved). Remote: `github.com/isaachartman/isaachartman`.
- **Branches:**
  - `main` = the live site, isaachartman.com, still the **Coming Soon** page. `index.html` there is a standalone page.
  - `dev` = the full portfolio. Everything in this session was committed and pushed to `origin/dev`. Last commit: `abe9092`.
- **Do not merge `dev` into `main`.** Isaac said so explicitly. A merge would replace Coming Soon with the full site (it conflicts in `index.html`) and ship the contact worker. Launch is a separate, deliberate decision.
- **Pages on dev:** `index.html` (home), `projects.html`, `cv.html`, `home-test.html`.
  - `cv.html` has **placeholder** content (invented roles and dates). It is currently linked from nowhere: the View CV buttons were removed.
  - `home-test.html` is a standalone copy of an earlier hero experiment, `noindex`, with a stale nav. It can be deleted.
  - The Featured Project paragraph on the home page is draft copy written by Claude. Replace with real wording.
- **Contact form:** posts to the Cloudflare Worker in `contact-worker/` (`https://contact-form.isaac-hartman.workers.dev`). Allowed origins already include isaachartman.com, www, and `portfolio-dev.isaac-hartman.workers.dev`.

## Current design (on dev)

- **Palette:** page is pure white. Grey band `#f1f1f1` (hardcoded in `css/style.css`, not a variable) behind Featured Project, About Me and Explorations; Latest, Skills and FAQ stay white.
- **Type:** every h1–h6 is Safiro. Lora only for body text.
- **Hero:** contained in the 1400px column. Title `/Creative Portfolio` and the intro above a 410px image (black and white, color on hover with the cursor dot). No button, no parallax, no overlay. 24px under the nav to the title, 80px from the image to the first divider.
- **Page headers** (home, projects, CV): two equal halves, no gap, with the intro's 2px grey rule exactly on the page center. Intro text is 15px muted, 40px padding after the rule.
- **Dividers:** 1px `--line` hairline, full page width, on the home page only (`.home` body class), above every section after the hero and above the footer.
- **Images on touch screens:** go from black and white to color while crossing the middle band of the viewport (IntersectionObserver in `js/main.js`, `rootMargin: '-35% 0px -35% 0px'`).
- **Projects page:** images are 540px tall.
- **Nav:** Featured, Latest, Projects, About, Skills, Explorations, Contact. FAQ link removed (the FAQ section is still on the page). Nav glass is white at 70%.

## Commits this session on `dev` (oldest to newest)

`6cc70bd` nav title clipping fix, `a527406` hero redesign, `46605df`/`ef73787` home-test.html (+noindex), `d8f1499` "/Creative Portfolio" headline, `407ecfe` remove View Work button, `6a62937` `7dc2f49` `93e7f25` hero spacing and 370px image, `890b18c` single-line dividers, `21f5947` header intro style, `f23f71f` grey bands, `98961a3` 410px image and tighter top, `6eff453` split headers, `5c80f0a` 540px project images, `5d2263c` `ada2756` dividers match projects page then full width, `c55fc16` nav changes, `f513ae0` touch color-on-scroll, `5dc52a3` 80px under hero, `740e239` Safiro headings, `ebeb95e` featured paragraph, `abe9092` remove View CV buttons.

On `main` (Coming Soon page, pushed): `1cc3abb` left-align content, `cac0a6b` headline line-height 0.88.

## Preview servers

- **4873:** `portfolio`, serves the repo folder directly, so it follows whichever branch is checked out.
- **4874:** `portfolio-dev`, serves a **snapshot** of `dev` exported with `git archive dev` into the session scratchpad. It goes stale until refreshed ("refresh the 4874 preview from dev"). The scratchpad path is per session, so a new chat has to recreate this.
- Both are defined in `Sites/.claude/launch.json` and run a tiny Node static server (`python3` is blocked by the Xcode license prompt on this Mac). The app stops them on restart; start again with `preview_start` by name.
- The repo root is the web root: there is no `public/` folder here (unlike patilarmenianmd).

## Design system

- Hosted, editable design system: https://claude.ai/artifact/7DztpABLsFgUwjnpDesVYs ("Portfolio Website Guidelines", updated to version 8 on Oct 12 to match this site, including a new PageHeader component).
- Editing it does not change the website; the site's CSS is changed separately.
- The Patil Armenian one is a separate artifact: https://claude.ai/artifact/3BxvUAyBpZXkrvjSFPYT8q.
- `/artifacts` is not available in this environment; open it by link or at claude.ai/code/artifacts.

## Open items and loose ends

- Replace placeholder content: `cv.html`, the featured paragraph, any picsum/stock images that remain.
- Decide when to launch: merge `dev` into `main` (resolve `index.html` in favor of dev), which also removes the Coming Soon page and `noindex`.
- Optional cleanup: `home-test.html`; unused JS in `js/main.js` (the nav `on-hero` observer and the hero parallax code, neither matches anything now); `--paper-2` duplicates `--paper`; `#f1f1f1` and the header rule grey could become variables.
- FAQ is no longer in the nav but the section is still on the home page.
- Pushing `main` publishes to the live site; pushing `dev` does not.

## Working agreements

- Commit and push are separate steps; Isaac asks for each ("commit this to dev", "push it to origin").
- Be explicit about **branch, file and where you are viewing it** (preview port, live site, or the repo) to avoid ambiguity.
- Claude verified changes in the in-app preview at laptop width (1512×800) and phone width (375×812) before reporting.
