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
img/fotos/galeria/  Gallery photos: <n>-600.webp (grid) and <n>-1200.webp (viewer, data-grande)
img/new/            Original photos from the couple (gitignored: 130 MB of JPEGs)
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
4. The olive texture alone is too light for `--marfil` text (~2.5:1). `.campo-olivo`
   draws `--velo-olivo` over it, which brings marfil to ~5.5:1 and `--marfil-suave` (.9) to
   ~4.8:1. Do not lighten the veil, lower `--marfil-suave`, or add light panels behind text
   without re-measuring (WCAG AA: 4.5:1, or 3:1 for text ≥ 24 px).
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
- Each face has its own wax seal, so it stays put during the flip. The seal is ~22 % of the
  visible silhouette width (`--lacre-ancho`; 35 % looked too big) and is centred on
  `--lacre-x`. That is 48.4 % for Recepción, because its art carries a shadow on the right.
- Flip affordance (owner picked it on 2026-11-08 from three animated mockups): the tag *teases* a
  flip (`@keyframes amago` on `.etiqueta__alza`: rotateY to -25° and back), 1 s after it scrolls
  into view (`.etiqueta.visible`) and then every 9 s. Meanwhile two short horizontal curls on its
  sides draw themselves and fade (`svg.etiqueta__orbita`, `@keyframes orbita`). They are the two ends
  of a flat orbit, styled like the small arrow next to the name. Vertical arcs read as "up/down", so
  the owner rejected them. The arrows sit inside `.etiqueta__giro` with backface hidden, so they vanish
  when flipped. The tease only runs while `data-volteada` is absent, so it stops once the guest has
  flipped a tag. There is also the small curved arrow next to the name (`svg.etiqueta__flecha`).
  Rejected by the owner: a "Ver detalles" pill, a round ↻ button on the corner, bold or vertical side
  arrows, and the seal rotating on hover. The seals do not animate.
- Back text uses `cqi` units (the reverso face is a size container). At 390 px it uses
  ~241 of 246 px in the plate, so there is almost no room left for more text.
- Clicking anywhere on the back except the map link flips the card back (`app.js`).
- `GIRO` in `app.js` must match the `.etiqueta__giro` transition.
- The front sways forever (`mece`), so Playwright needs `click(force=True)` on it.

## Invitation codes

**The Google Sheet is the source of truth for passes** (owner's call, 2026-11-09). On load, `app.js`
shows the invitation at once from `js/invitaciones.js` (local fallback), then asks the Sheet
(`DESTINO?i=<code>`, `doGet` in `registro.gs`, 8 s timeout). The Sheet's answer wins:
- a different number rebuilds the form and keeps what was typed;
- `existe:false` (row deleted or passes 0) shows the "Invitación personal" notice;
- any error falls back to the local list.

A new row typed in the Sheet's Invitaciones tab gets a code automatically (`onEdit`). The local list and
`referencia/invitados.csv` only matter as a fallback, and for the PDF of links.

Each invitation gets a link `?i=<code>`, nothing else. Never use `?pases=N`: guests could
just edit the number. The links carry no names on purpose (owner's call, 2026-11-06): the CSV's
`nombre` column is only an internal label, and guests type their own names in the form.
`app.js` still shows an optional `&nombre=` under the title, but the script no longer adds it.

- The real list (names, passes, codes, links) is `referencia/invitados.csv`. It is
  gitignored and must never be committed, because the repo is public.
- `python3 herramientas/invitaciones.py` gives codes to new rows and keeps the existing
  ones, so links already sent keep working. It rewrites the CSV with a `link` column and
  writes `js/invitaciones.js`: PBKDF2-SHA256 hash of the code → passes, no names.
- `app.js` hashes `?i=` with WebCrypto (the salt and iteration count must match the
  script) and looks it up. A valid code shows "N pases", the `nombre` under the title and
  N name fields ("Invitado 1…N") built from the `[data-invitado]` template, all inside `#conInvitacion`.
- The form asks only for names, ONE contact phone (`t1`) and a message (owner's call, 2026-11-08).
  There is no per-person yes/no: a written name means that person is coming, and a blank one means
  they are not. "No podremos asistir" (`#noAsistiremos`) sends the same form with everyone as "no"
  and needs only the first name. The page still posts `a1…aN` for each named guest, so
  `registro.gs` did not have to change. With 1 pass the legend reads "Tu nombre".
  With no code, or an unknown one, only `#sinInvitacion` ("Invitación personal") is shown:
  no passes, no form. Both start `hidden` in the HTML so neither flashes.
- WebCrypto needs https or localhost. Opening `index.html` as a file shows only the notice.
- The WhatsApp message includes the code and the passes, so the couple can check it against the list.

## Photos outside the gallery

All of them come from the couple's park session (`img/new`, IMG_<n>):
hero/hero-movil/compartir.jpg = 9667, framed photos = 9654 and 9681 (0972 looked off), vestimenta = 9684,
`.cinta` photo bands = 9643 (before El día) and 9680 (before Regalos).
- The two framed photos are cream stamp frames with a hand-cut wavy edge, drawn from scratch by
  `herramientas/marcos.py` (900×1060 WebP, photo slightly tilted inside). They replaced the old
  low-res stamp frames, which had a notch on the left edge. The bride rejected the silver ornate
  frame (`img/new/frame.png`) on 2026-11-08: the stamp look is the one she wants.
- `.cinta__foto` overflows its band by 20 % top and bottom for the parallax (factor 0.07).
  Raise both together or the edge shows.
- Vestimenta's veil was darkened for the brighter photo (marfil ≥ 4.8:1). Re-measure if the photo changes.

## Gallery

- Row-based grid (4 columns, 2 at ≤ 860 px). Portraits take 1 cell at 2:3. Landscapes
  (`li.mosaico__ancha`) take 2 cells at 4:3, cropped with `object-fit: cover`.
- Keep items in 2-cell blocks (two portraits, or one landscape) so rows never leave holes.
  The last landscape alone is centred by `.mosaico__ancha:last-child`.
  A last row of only two portraits is centred at 4 columns (`:nth-child(4n+1):nth-last-child(2)`).
- Only park-session photos (22). The old mirador photos `g1`–`g9` were removed on 2026-11-09 at the
  owner's request; do not bring them back.
- The first 12 are photos that appear nowhere else on the page. The ones used above
  (hero 9667, polaroids 9654/9681, vestimenta 9684, cintas 9643/9680) come after them.
- The first 12 show at first. The rest carry `data-extra hidden` and appear with "Ver todas".
  The viewer goes through all of them and loads `data-grande` when there is one.
- New photos: `ImageOps.exif_transpose`, then 600 px (q72) and 1200 px (q74) WebP.

## Cache

`index.html` loads `css/estilos.css?v=…` and `js/app.js?v=…`. Bump that date on both
whenever either file changes, or browsers (and GitHub Pages' 10-minute cache) keep
serving the old copy.

## Testing before committing

There is no test suite. Before pushing, at minimum:

- Serve locally with `python3 -m http.server 8000` and open http://localhost:8000
- Check desktop width and a phone width (DevTools device mode, ~390 px)
- Click every nav link, flip both tags, open/close the gallery, submit an empty form
- Confirm there is no horizontal scroll on the phone width

## Pending work

Content the couple still needs to provide:
- [x] WhatsApp number in `js/app.js` (`WHATSAPP` = 526671020246, given by the owner on 2026-10-15)
- [x] RSVP deadline: 15 de diciembre de 2026
- [x] Tornafiesta removed from the itinerary on purpose (2026-11-05): the couple keeps it
      private. Do not add it back.
- [x] Vestimenta: "Formal"; the note says the colours are reserved for "los novios" (owner, 2026-11-09)
- [x] Bank details: full CLABE and debit card are public on purpose (owner, 2026-11-09). They show in
      groups of digits; the Copiar buttons copy them without spaces
- [x] Liverpool (evento 60043251) and Amazon list URLs

Code tasks not done yet:
- [x] `og:image` absolute URL to `img/compartir.jpg` (1200×630), plus og:url, twitter:card
- [x] `<meta name="robots" content="noindex, nofollow">`
- [ ] Favicon from `img/arte/logo-az.webp` (currently a 404 on /favicon.ico)
- [x] Personalised passes by invitation code (see "Invitation codes")
- [x] RSVPs to a private Google Sheet: `herramientas/registro.gs` (Apps Script) + setup guide
      `herramientas/REGISTRO.md`. Connected: `DESTINO` holds the web app URL (2026-11-07).
      The page posts urlencoded fields (n1, t1, a1… deseos, codigo, pases) and expects `{"ok": true}`;
      anything else shows a "Enviar por WhatsApp" button (no auto-open: popups get blocked after a fetch).
      The script takes the passes from its own Invitaciones tab, never from the post.
