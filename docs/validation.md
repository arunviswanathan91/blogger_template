# Validation — 24 September 2026

The generated theme and the interactive preview share the same CSS, navigation, artwork, footer, overlays, and reading enhancements.

## Completed

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
