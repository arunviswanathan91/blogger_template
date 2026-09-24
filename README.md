# The Yellow Bottle

A custom white-and-black journal for Arun Viswanathan. Oversized typography, narrow chapter rails, interactive geometric bottle artwork, and a quiet reading view. English and Malayalam are both supported.

## Use it

- **`the-yellow-bottle.xml`** is the complete, self-contained Blogger theme. This is the file to install.
- **`index.html`** is an interactive, standalone design preview. Open it in a browser. Its five entries are illustrative samples from the supplied mockup, not live posts.

To install, save a backup of the existing theme in **Blogger → Theme → menu → Backup**. Then use **Restore → Upload** with `the-yellow-bottle.xml`, or paste its full contents into **Edit HTML**. Blogger themes use XML containing HTML, CSS, JavaScript, and Blogger template expressions; the ordinary HTML preview cannot be installed as a theme.

If Blogger offers a separate mobile theme, choose the desktop/custom theme for mobile so this theme’s responsive layout is used. Preview a home page, a Malayalam post, a label page, a static page, and a comment thread before applying it to the public blog.

## What is included

- Pure white background, black text and graphic elements, grayscale rules.
- Original SVG artwork; the bottle changes composition when clicked or keyboard-activated.
- Full-screen menu and search, keyboard focus containment, Escape to close.
- Native Blogger posts, permalinks, labels, pagination, static pages, monthly archive, and comments.
- Post images remain in their original colors. The interface and fallback artwork are monochrome.
- Native post/search/archive rendering works without JavaScript. JavaScript adds the overlays, artwork, reading-size preference, copy link, and progress indicator.
- Reduced-motion support, responsive media, Malayalam font support, and a print reading layout.
- The exact supplied copyright line with the **Copyright and Content Use** link.

Only two invisible-to-the-design Blogger data components remain: `Blog1` supplies posts and comments; `BlogArchive1` supplies the monthly index. There are no sidebar gadgets, ad placements, popular-post panels, or stock Blogger navigation styles.

The production XML contains no sample posts. The home page automatically features the newest post and lists the remaining posts once. Search uses Blogger’s native search endpoint; label links use the existing blog labels:

| Visible category | Existing Blogger label |
| --- | --- |
| Poetry / കവിതകൾ | `ente kavithakal` |
| Stories / കഥകൾ | `ente kathakal` |
| Essays / ലേഖനങ്ങൾ | `Article` |
| Selected / തിരഞ്ഞെടുത്ത | `My picks` |
| Moving image / വീഡിയോസ് | `Video` |

The `post.date`, `post.author.name`, and native comment structures target Blogger layout version 3 / widget version 2, matching the supplied current theme. Comments retain Blogger’s native rendering, authentication, reply, moderation, and paging mechanisms.

## Edit and rebuild

```sh
python3 scripts/build.py
python3 scripts/validate.py
```

No package installation or external build service is required. `src/theme.css` and `src/theme.js` are shared by the preview and installed theme. `src/frame.html` controls navigation, footer, and overlays. `src/hero.html` controls the opening composition. `src/blogger-main.xml` binds the design to Blogger data. The build inlines everything into the two deliverables, apart from Google Fonts and media already hosted in blog posts. System fonts are fallbacks when Google Fonts is unavailable.

Font sizes, white/black values, and spacing are at the top of `src/theme.css`. Categories are in `scripts/build.py`. Update the brand/footer in `src/frame.html`. Do not edit only the generated files, because the next build replaces them.

## Design references

The supplied references informed different aspects of the design; their assets and source code are not used:

- [G!theimagineers](https://www.gtheimagineers.com/en.html): fine divisions, geometric forms, narrow chapter navigation, translated to a white canvas.
- [Benjamin Righetti](https://benjaminrighetti.netlify.app/): oversized type and a spacious opening composition.
- [Murmure Journal](https://murmure.me/journal/): expressive scale and an editorial writing index.
- [Stuurmen](https://stuur.men/): strong typography and minimal hierarchy.
- [Bruno Arizio](https://brunoarizio.com/): asymmetry and small, carefully placed metadata.
- [Trip in the dark](https://tripinthedark.ru/en): discovery through interaction and paced transitions.

Blogger implementation references: [widget tags](https://support.google.com/blogger/answer/46995?hl=en), [data tags](https://support.google.com/blogger/answer/47270?hl=en), and [page elements](https://support.google.com/blogger/answer/46888?hl=en). Native comment includables were adapted from the user-supplied existing theme.

Local XML validation is not Blogger’s server-side import validation. See `docs/validation.md` for the actual checks completed and remaining platform checks.
