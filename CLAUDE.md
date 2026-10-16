# Angélica & Zaid — wedding site

Static one-page wedding invitation. No build step, no framework, no dependencies.
Deployed to GitHub Pages from the `main` branch root: every push to `main` goes live
in about a minute. Live URL: https://villacode.github.io/sitio-angelica-zaid/
Work happens on branches (e.g. `cambios-novios`); nothing is merged or pushed to `main`
until the owner says "publica".

## Structure

```
index.html          All content, in Spanish (es-MX)
css/estilos.css     All styles. Design tokens are CSS variables at the top of :root
css/fuentes/        Self-hosted woff2 fonts (Italiana, Sacramento, Bodoni Moda, Quattrocento)
js/app.js           All behaviour, vanilla JS in one IIFE. Config constants at the top
img/fotos/          Photos (WebP)
img/arte/           Stickers, ornate tags (front + reverso), wax seals, logo-az (WebP with alpha)
img/compartir.jpg   1200×630 share preview (og:image), cropped from the hero photo
img/texturas/       Seamless background tiles
.nojekyll           Tells GitHub Pages to serve files as-is (do not delete)
```

## Conventions

- Class names, IDs, comments and variable names are in **Spanish**. Keep it that way.
  BEM-ish naming: `.bloque__elemento--modificador` (e.g. `.etiqueta__cara--reverso`).
- Visible copy is Mexican Spanish. Use accents correctly (Angélica, Recepción, Galería).
- Palette lives in `:root` variables (`--olivo`, `--papel`, `--vino`, `--marfil`...).
  Do not hard-code new colours; add a variable if one is truly needed.
- Fonts: `--display` (Italiana), `--display-chica` (Bodoni Moda), `--script` (Sacramento),
  `--texto` (Quattrocento).
  - Italiana is hairline-thin: below ~1rem, and in widely letter-spaced uppercase
    (`.titulo-seccion`), it loses the T crossbar. Those use `--display-chica`.
  - Sacramento has a lower x-height than the old Parisienne: every `--script` size
    is multiplied by `--script-escala` (1.15). Do the same for new script text.
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

## Tags (Ceremonia / Recepción)

```
.etiqueta.etiqueta--ceremonia      sets --proporcion, --placa-*, --lacre-x, --lacre-ancho
  .etiqueta__alza                  lift (scale 1.05, up 14px) mid-flip via keyframes
    .etiqueta__giro                rotateY 0 → 180deg, .9s; height = --alto-etiqueta
      button.etiqueta__cara--frente   art + lacre + .etiqueta__nombre below the card
      div.etiqueta__cara--reverso     [hidden] until flipped; reverso art + lacre +
        .etiqueta__info               absolute over the plain plate, padding 6%
```

- Front and back art are the same size, so both faces share one box. Plate insets come
  from the couple's `referencia/etiquetas.json` (kept outside the repo).
- Each face has its own wax seal, so it stays put during the flip. The seal is ~35 % of the
  visible silhouette width (`--lacre-ancho`) and is centred on `--lacre-x`. That is 48.4 %
  for Recepción, because its art carries a shadow on the right.
- Back text uses `cqi` units (the reverso face is a size container). At 390 px it uses
  ~241 of 246 px in the plate, so there is almost no room left for more text.
- Clicking anywhere on the back except the map link flips the card back (`app.js`).
- `GIRO` in `app.js` must match the `.etiqueta__giro` transition.
- The front sways forever (`mece`), so Playwright needs `click(force=True)` on it.

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
- [ ] Tornafiesta time (itinerary shows "Hora por confirmar") and its sticker from Angie,
      in the same style as the others. The last `:nth-child(6)` delay rule is ready for it
- [ ] Vestimenta: "Formal" and the note text are waiting for the couple's confirmation
- [ ] Decide whether the bank details should stay on a public page
- [x] Liverpool (evento 60043251) and Amazon list URLs

Code tasks not done yet:
- [x] `og:image` absolute URL to `img/compartir.jpg` (1200×630), plus og:url, twitter:card
- [x] `<meta name="robots" content="noindex, nofollow">`
- [ ] Favicon from `img/arte/logo-az.webp` (currently a 404 on /favicon.ico)
- [ ] Personalised passes via URL: `?pases=4&nombre=Familia%20Ochoa` should set
      `.pases__num` and prefill `#n1`. Validate `pases` as an integer 1–10.
- [ ] Optional: send RSVPs to Formspree or Google Apps Script via the `DESTINO` constant
