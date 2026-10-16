# Angélica & Zaid — sitio de boda

Sitio estático, sin build y sin dependencias. Se abre con doble clic en `index.html`
o se sube tal cual a Netlify, Vercel, GitHub Pages o cualquier hosting.

```
index.html          Todo el contenido
css/estilos.css     Estilos
js/app.js           Comportamiento
img/fotos/          Fotografías (WebP)
img/arte/           Stickers, etiquetas y sellos (WebP con transparencia)
img/texturas/       Fondos que se repiten
```

Peso total: **1.2 MB**, contra los 39 MB del PDF original.

---

## Antes de publicar

Cinco cosas quedaron como estaban en el diseño original y hay que revisarlas.

1. **Fecha límite para confirmar.** El diseño decía `00 de Mes del 2026`. Puse
   **1 de diciembre de 2026** como suposición. Está en `index.html`, busca
   `confirmar__limite`.

2. **Números de mesa de regalos.** Liverpool y Amazon tienen el mismo número,
   `02938475`. Probablemente uno de los dos está mal.

3. **Enlaces de las mesas de regalos.** Apuntan a la página general de Liverpool y
   Amazon porque no tengo la URL del evento. Cámbialas por el enlace directo.

4. **Datos bancarios.** La CLABE y la tarjeta aparecen parcialmente enmascaradas,
   igual que en el original. Vale la pena decidir si quieren esos números en una
   página pública o si prefieren mandarlos por WhatsApp a quien los pida.

5. **Pases por invitado.** Está fijo en `2 pases`. Si cada invitación lleva un
   número distinto, ve la sección "Pases personalizados" más abajo.

---

## El formulario de confirmación

Ya funciona de las dos formas. Arriba de `js/app.js` hay dos variables:

```js
var DESTINO  = "";                 // URL de Formspree o Apps Script
var WHATSAPP = "526671234567";     // número con lada, solo dígitos
```

- **Si dejan `DESTINO` vacío**, al enviar se abre WhatsApp con la confirmación ya
  escrita y solo hay que darle enviar. No hace falta configurar nada más, pero
  **hay que cambiar el número de WhatsApp**: el que está ahí es de ejemplo.
- **Si ponen una URL en `DESTINO`**, las respuestas se mandan ahí en segundo plano.
  Formspree es gratis hasta 50 respuestas al mes; Google Apps Script no tiene
  límite. Si el envío falla, cae automáticamente a WhatsApp.

---

## Pases personalizados

Si quieren que cada invitación muestre su propio número de pases, se puede leer de
la dirección sin necesidad de servidor. Manda a cada quien un enlace como
`…/index.html?pases=4&nombre=Familia%20Ochoa` y agrega esto al final de `app.js`:

```js
var url = new URLSearchParams(location.search);
if (url.get("pases")) document.querySelector(".pases__num").textContent = url.get("pases");
if (url.get("nombre")) document.getElementById("n1").value = url.get("nombre");
```

---

## Tipografías

El diseño de Canva usa **Le Jour Serif**, **Madelyn Rough** y **Quattrocento**.
Las tres están licenciadas dentro de Canva, así que en la web solo Quattrocento se
puede usar tal cual (está en Google Fonts). Para las otras dos puse sustitutos
cercanos:

| Diseño original | En el sitio | Papel |
|---|---|---|
| Le Jour Serif | Italiana (Bodoni Moda en textos chicos y títulos espaciados) | Títulos y nombres |
| Madelyn Rough | Sacramento | Textos manuscritos |
| Quattrocento | Quattrocento | Cuerpo de texto — es la original |

Si compran la licencia web de las dos primeras, se cambian en un solo lugar:
las variables `--display` y `--script` al inicio de `css/estilos.css`.

Las tipografías están autoalojadas en `css/fuentes/` con reglas `@font-face`:
el sitio no carga nada de Google Fonts.

---

## Paleta

Todas están como variables al inicio de `estilos.css`.

| | |
|---|---|
| Olivo hondo | `#5F6347` |
| Olivo | `#7E8264` |
| Papel | `#EFE9DE` |
| Papel tibio | `#F6F1E7` |
| Vino | `#660607` |
| Marfil | `#F7F3EA` |

---

## Animaciones

Todas se apagan solas si el sistema tiene activado "reducir movimiento".

| Dónde | Qué pasa |
|---|---|
| Portada | La foto respira lentamente y hace parallax; el texto entra escalonado |
| Arriba de todo | Barra fina que marca cuánto llevas leído |
| Títulos | Las letras se cierran desde muy separadas |
| Polaroids | Caen cada una por su lado y se acomodan en su ángulo |
| Lacres | Se estampan, con rebote |
| Etiquetas | Flotan muy ligero mientras esperan; al tocarlas giran en 3D |
| Itinerario | El hilo se dibuja al bajar; los stickers brotan y luego flotan |
| Fiesta | La bola disco se contonea sola |
| Regalos | El carrito entra manejando |
| Galería | Las fotos suben escalonadas, una tras otra |
| Confirmación | La A y la Z se juntan; el número de pases cuenta hacia arriba |
| Menú y botones | Subrayado que se dibuja, color que entra barriendo |

## Contraste

El formulario iba antes directo sobre el olivo y las etiquetas quedaban en
**2.44:1**, muy por debajo del mínimo legible (4.5:1). Ahora va sobre una tarjeta
de papel crema:

| | Antes | Ahora |
|---|---|---|
| Etiquetas de los campos | 2.44:1 | 5.55:1 |
| Texto que escribe el invitado | — | 11.08:1 |
| Botón de enviar | — | 11.70:1 |

## Notas técnicas

- **Sin JavaScript** el sitio sigue siendo legible: se ve todo el contenido, solo se
  pierden la cuenta regresiva, el volteo de las etiquetas y el visor de fotos.
- **`prefers-reduced-motion`** está respetado: quien tenga activada esa preferencia
  en su sistema no ve ninguna animación.
- **Teclado**: las etiquetas se voltean con Enter y se cierran con Escape; el visor
  de galería se mueve con las flechas, se cierra con Escape y atrapa el foco dentro.
- **Táctil**: el visor se pasa deslizando el dedo.
- **Impresión**: hay una hoja de estilos para imprimir que quita el menú, el
  formulario y los fondos oscuros.
- La cuenta regresiva apunta a `2026-12-26T14:00:00-07:00` (hora de Culiacán). Está
  arriba de `app.js` por si hay que ajustarla.

## Cómo se probó

Todo el sitio se revisó en un navegador real (motor Chromium) a **1440 px y a
390 px**, con una batería que:

- comprueba que los 42 controles de la página reciben el clic donde se ven,
- mide que ningún objetivo táctil baje de 44 px,
- verifica que no haya scroll horizontal en teléfono,
- confirma que ninguna imagen quede rota.

Los tres pasan en ambos anchos. Aun así, conviene abrirlo en un teléfono real
antes de mandarlo: Safari en iOS tiene sus propias mañas.

## Qué falta

- Las fotos salieron del PDF, o sea que ya venían comprimidas por Canva. Si tienen
  los archivos originales del fotógrafo, vale muchísimo la pena volver a generar
  `img/fotos/` desde ahí. El script que las optimiza está en el paquete de assets.
- No hay favicon. El logo `img/arte/logo-az.webp` sirve de base.
