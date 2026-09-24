# Validation — 24 September 2026

The generated theme and the interactive preview share the same CSS, navigation, artwork, footer, overlays, and reading enhancements.

## Posts restored, mathematical art, index overlay (latest pass)

- Live report: posts and the monthly index rendered empty on the real blog while everything outside the two Blogger widgets appeared. Blogger's servers are not reachable from this environment, so the widget code was compared against the blog's previous, working theme and rewritten to its proven constructs: no `var='this'` on `main`, the month loop in a separate includable reading Blogger's own `this`, no out-of-scope loop index (row numbers are now CSS counters), `<data:post.date/>` and `data:post.snippets` instead of `format`/`snippet()` expressions.
- Added a feed safety net and tested it against a local server serving a Blogger-shaped JSON feed: a blank label page fetched `/feeds/posts/summary/-/ente%20kathakal` and rendered both entries; a blank post URL rendered the full post; a blank archive was rebuilt as months with counts.
- Scroll reveals now have a failsafe so on-screen content can never stay invisible.
- Canvas figures verified by CDP in light, dark (white + yellow), a 390 px phone (no overflow), and reduced motion (drawn complete immediately, no drift). Clicking cycles forms; the pointer leans them.

## Panels, curtain, and circle animation (earlier pass)

- Drove the preview through the Chrome DevTools Protocol (clicks, pointer moves, key presses, mid-animation captures): tabs unfold the right panel (active 1115 px, others 42 px at 1440 px wide), each chapter's circle figure draws completely, the menu wipes in and out, Escape closes it, it is re-hidden afterwards, and focus returns to the Menu button. No JavaScript errors.
- Headless Chrome reports no fine pointer, so pointer-follow features stay off there by design; they were verified on a copy with that check forced on (tunnels lean toward the cursor, emblem tilt reached 9.7°).
- Checked dark mode, a true 390 px viewport (no horizontal overflow; tabs remain links), and `prefers-reduced-motion` (states apply instantly).
- Fixed during testing: `vector-effect: non-scaling-stroke` broke `pathLength`-normalised dashes, leaving circles three-quarters drawn.

## Design refresh (earlier pass)

Reworked the design per follow-up feedback: a true light/dark toggle, Feather-icon-based interface icons in place of the earlier bespoke ones, a mathematically generated infinity/orbit emblem in place of the literal bottle illustration, mathematically-derived polygon markers for the five chapter icons, and an overall reduction in motion (no autoplay animation; a couple of primary buttons get a small, coherent cursor-follow hover instead).

- `python3 scripts/build.py` and `python3 scripts/validate.py` both pass on the rebuilt sources.
- Screenshotted `index.html` with a headless Chromium binary (no automation framework available in this environment) at desktop width, at true 390 px and 320 px phone widths via `docs/responsive-preview.html`'s iframe technique, and with `data-theme="dark"` forced — confirmed no horizontal overflow at any size and correct color inversion throughout (header, hero, lead art, about mark, footer).
- Confirmed via computed-style inspection (not just pixel sampling, which is misleading under this container's font rendering) that themed text and links resolve to the exact `--ink`/`--paper` values in both themes.
- Verified both click-to-rearrange emblem compositions (`art-shift-1`, `art-shift-2`) render as intended, and that the menu overlay opens with the new close icon in place.
- `node --check` (via `scripts/validate.py`) confirms `theme.js`'s new theme-toggle and magnetic-hover code is syntactically valid; the magnetic-hover effect itself needs a real pointer to exercise and was reviewed by hand instead of screenshotted.

## Prior pass — completed

- `python3 scripts/build.py` produces both deliverables reproducibly.
- `python3 scripts/validate.py` passes XML parsing, Blogger section and include structure, native post bindings, preview-data isolation, copyright/link checks, unique preview IDs, anchor checks, and JavaScript syntax validation.
- `git diff --check` passes.
- Visually inspected the public GitHub HTML preview in Chrome, including the desktop opening and the mobile opening.
- Measured responsive iframe viewports at 320, 390, 768, and 1280 px. At each size, document scroll width equals document client width: no horizontal page overflow. Browser scrollbars reduce the corresponding content widths to 305, 375, 753, and 1265 px.
- Tested the bottle composition change, menu opening/closing, Shift+Tab focus wrap, Escape close, search for `rain`, Stories category filtering, an article opened from a generated result link, the reading-size control, and the five-entry sample archive.
- The reading-size control changed the CSS preference from 23 to 25 px. Preferences persist when browser storage is available.
- Fixed an intrinsic artwork size that overflowed small screens, and made generated preview links robust to a preview service inserting its own HTML base URL.
- No application JavaScript errors were reported by the browser during the final checks. A browser-extension metadata error originated from the review environment, outside the application.

## Platform checks still required

The XML has **not** been uploaded into an authenticated Blogger theme editor. Local parsing cannot certify Blogger's server-side import, live data formatting, or runtime behavior of its embedded comment service. The native comment code was retained from the supplied current Blogger layout-v3/widget-v2 theme, and the installed theme uses real Blogger data rather than fetching posts with client-side JavaScript.

Before applying it to the live blog, import it into Blogger Preview or a test blog and check home, older-post pagination, a Malayalam post, a label search, a text search, a static page, and a comment thread. Only that environment can verify Blogger's server-generated values, sign-in, moderation, and comment iframe. No live blog settings or posts were changed during this work.

`index.html` contains deliberately labeled illustrative samples. Those samples do not appear in `the-yellow-bottle.xml`.

## Screenshot

![Desktop opening](desktop-preview.jpg)

For repeatable small-screen review, open `docs/responsive-preview.html` locally beside the generated `index.html`, then use its width selector. This is a review utility and is not included in the Blogger theme.
