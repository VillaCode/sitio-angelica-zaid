# Angélica & Zaid — wedding site

Static one-page wedding invitation. No build step, no framework, no dependencies.
Deployed to GitHub Pages from the `main` branch root: every push to `main` goes live
in about a minute.

## Structure

```
index.html          All content, in Spanish (es-MX)
css/estilos.css     All styles. Design tokens are CSS variables at the top of :root
css/fuentes/        Self-hosted woff2 fonts (Bodoni Moda, Parisienne, Quattrocento)
js/app.js           All behaviour, vanilla JS in one IIFE. Config constants at the top
img/fotos/          Photos (WebP)
img/arte/           Stickers, ornate tags, wax seals, monogram (WebP with alpha)
img/texturas/       Seamless background tiles
.nojekyll           Tells GitHub Pages to serve files as-is (do not delete)
```

## Conventions

- Class names, IDs, comments and variable names are in **Spanish**. Keep it that way.
  BEM-ish naming: `.bloque__elemento--modificador` (e.g. `.etiqueta__cara--reverso`).
- Visible copy is Mexican Spanish. Use accents correctly (Angélica, Recepción, Galería).
- Palette lives in `:root` variables (`--olivo`, `--papel`, `--vino`, `--marfil`...).
  Do not hard-code new colours; add a variable if one is truly needed.
- Fonts: `--display` (Bodoni Moda), `--script` (Parisienne), `--texto` (Quattrocento).
- Never load anything from a CDN or Google Fonts. Everything must work offline.
- Images: convert new photos to WebP before adding them. Keep photos ≤ 2200 px wide.

## Rules that have already caused real bugs

1. **Never give an element with a `hidden` attribute its own `display` value without
   relying on the global `[hidden] { display: none !important; }` rule.** The gallery
   overlay once had `display: grid`, which overrode `hidden`, so an invisible
   full-screen layer blocked every click on the page.
2. Any new fixed or absolute overlay must have `pointer-events: none` unless it is
   meant to be clicked.
3. Every new animation must be neutralised inside the
   `@media (prefers-reduced-motion: reduce)` block, which must stay **last** in
   `estilos.css`. If an element starts at `opacity: 0` for an entrance animation,
   that block must restore it to visible.
4. Text on the olive background fails contrast below ~0.9 opacity on `--marfil`.
   Forms and dense text go on a cream (`--papel-tibio`) surface instead.
5. Touch targets stay at least 44 px tall.
6. After editing CSS, check that `{` and `}` counts still match.

## Testing before committing

There is no test suite. Before pushing, at minimum:

- Serve locally with `python3 -m http.server 8000` and open http://localhost:8000
- Check desktop width and a phone width (DevTools device mode, ~390 px)
- Click every nav link, flip both tags, open/close the gallery, submit an empty form
- Confirm there is no horizontal scroll on the phone width

## Pending work

Content the couple still needs to provide:
- [ ] Real WhatsApp number in `js/app.js` (`WHATSAPP` constant) — current one is a placeholder
- [ ] RSVP deadline in `index.html` (`.confirmar__limite`) — "1 de diciembre" is a guess
- [ ] Liverpool and Amazon event numbers (both currently `02938475`) and their direct URLs
- [ ] Decide whether the bank details should stay on a public page

Code tasks not done yet:
- [ ] `og:image` must be an absolute URL to a **JPG** (~1200×630) so WhatsApp shows a
      preview card. Needs the final site URL.
- [ ] Add `<meta name="robots" content="noindex, nofollow">` so the page stays out of search
- [ ] Favicon from the A/Z monogram
- [ ] Personalised passes via URL: `?pases=4&nombre=Familia%20Ochoa` should set
      `.pases__num` and prefill `#n1`. Validate `pases` as an integer 1–10.
- [ ] Optional: send RSVPs to Formspree or Google Apps Script via the `DESTINO` constant
