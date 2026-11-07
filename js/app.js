/* ═══════════════════════════════════════════════════════════
   Angélica & Zaid — comportamiento
   Sin dependencias. Todo degrada con gracia si algo falla.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ═══ CONFIGURACIÓN ═══════════════════════════════════════
     DESTINO: URL de la app web de Apps Script (ver herramientas/registro.gs).
              Si la dejas vacía, las confirmaciones llegan por WhatsApp.
     WHATSAPP: número con lada de país, solo dígitos.               */
  var DESTINO  = "";
  var WHATSAPP = "526671020246";
  /* ═════════════════════════════════════════════════════════ */

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── Entrada de la portada ─────────────────────────────── */
  // La clase .con-js ya está puesta desde el <head>; aquí solo
  // arrancamos la secuencia una vez que la foto está lista.
  var fotoPortada = document.querySelector(".portada__foto img");
  function arranca() { document.documentElement.classList.add("listo"); }
  if (!fotoPortada || fotoPortada.complete) arranca();
  else {
    fotoPortada.addEventListener("load", arranca, { once: true });
    fotoPortada.addEventListener("error", arranca, { once: true });
    setTimeout(arranca, 2200); // por si la foto tarda demasiado
  }

  /* ─── Cuenta regresiva ──────────────────────────────────── */
  // Ceremonia: 26 de diciembre de 2026, 2:00 pm, hora del Pacífico (Culiacán, UTC−7)
  var BODA = new Date("2026-12-26T14:00:00-07:00");

  var reloj = {
    dias:  document.getElementById("cDias"),
    horas: document.getElementById("cHoras"),
    min:   document.getElementById("cMin"),
    seg:   document.getElementById("cSeg")
  };
  var relojTexto = document.getElementById("relojTexto");
  var previo = {};

  function dosDigitos(n) { return n < 10 ? "0" + n : String(n); }

  function pintar(nodo, valor, clave) {
    if (!nodo || previo[clave] === valor) return;
    previo[clave] = valor;
    nodo.textContent = valor;
    if (quieto) return;
    nodo.classList.remove("late");
    void nodo.offsetWidth;          // reinicia la animación
    nodo.classList.add("late");
  }

  function tic() {
    var falta = BODA - Date.now();

    if (falta <= 0) {
      ["dias", "horas", "min", "seg"].forEach(function (k) {
        if (reloj[k]) reloj[k].textContent = "00";
      });
      if (relojTexto) relojTexto.textContent = "¡Hoy es el día!";
      var titulo = document.getElementById("cuentaTitulo");
      if (titulo) titulo.textContent = "Hoy nos casamos";
      clearInterval(latido);
      return;
    }

    var s = Math.floor(falta / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var g = s % 60;

    pintar(reloj.dias,  dosDigitos(d), "d");
    pintar(reloj.horas, dosDigitos(h), "h");
    pintar(reloj.min,   dosDigitos(m), "m");
    pintar(reloj.seg,   dosDigitos(g), "s");

    if (relojTexto && (!previo.aviso || Date.now() - previo.aviso > 60000)) {
      previo.aviso = Date.now();
      relojTexto.textContent = "Faltan " + d + " días y " + h + " horas.";
    }
  }

  tic();
  var latido = setInterval(tic, 1000);

  /* ─── Navegación ────────────────────────────────────────── */
  var nav = document.getElementById("nav");
  var portada = document.getElementById("inicio");
  var navAbrir = document.getElementById("navAbrir");
  var navLista = document.getElementById("navLista");

  if (nav) nav.hidden = false;

  if (nav && portada && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      nav.dataset.visible = entradas[0].isIntersecting ? "false" : "true";
    }, { rootMargin: "-12% 0px 0px 0px" }).observe(portada);
  } else if (nav) {
    nav.dataset.visible = "true";
  }

  function cerrarMenu() {
    if (!navAbrir || !navLista) return;
    navAbrir.setAttribute("aria-expanded", "false");
    navLista.dataset.abierto = "false";
  }

  if (navAbrir && navLista) {
    navAbrir.addEventListener("click", function () {
      var abierto = navAbrir.getAttribute("aria-expanded") === "true";
      navAbrir.setAttribute("aria-expanded", String(!abierto));
      navLista.dataset.abierto = String(!abierto);
    });
    navLista.addEventListener("click", function (e) {
      if (e.target.closest("a")) cerrarMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrarMenu();
    });
  }

  /* Marca la sección visible en el menú */
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('.nav__lista a[href^="#"]'));
  var destinos = enlaces
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (destinos.length && "IntersectionObserver" in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        enlaces.forEach(function (a) {
          a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    destinos.forEach(function (d) { vigia.observe(d); });
  }

  /* ─── Revelado al scroll ────────────────────────────────── */
  var porRevelar = document.querySelectorAll(
    "[data-revela], .linea__paso, .titulo-seccion, .mosaico li, " +
    ".itinerario__lacre, .padres__vela, .regalos__carro, .confirmar__logo, .polaroides");

  // índice para escalonar la galería
  Array.prototype.forEach.call(document.querySelectorAll(".mosaico li"), function (li, i) {
    li.style.setProperty("--i", i % 6);   // el retraso no crece con fotos que llegan tarde
  });

  if (!("IntersectionObserver" in window) || quieto) {
    Array.prototype.forEach.call(porRevelar, function (el) { el.classList.add("visible"); });
  } else {
    var revelador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var retraso = Math.min(i, 4) * 90;
        setTimeout(function () { en.target.classList.add("visible"); }, retraso);
        revelador.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(porRevelar, function (el) { revelador.observe(el); });
  }

  /* ─── Etiquetas que voltean ─────────────────────────────── */
  var GIRO = 900;   // ms; igual que la transición de .etiqueta__giro

  Array.prototype.forEach.call(document.querySelectorAll(".etiqueta"), function (tarjeta) {
    var frente = tarjeta.querySelector("[data-voltea]");
    var reverso = tarjeta.querySelector(".etiqueta__cara--reverso");
    if (!frente || !reverso) return;

    function voltear(abrir) {
      frente.setAttribute("aria-expanded", String(abrir));

      if (abrir) {
        // Hay que mostrar la cara trasera y esperar un cuadro antes de
        // girar: si no, el navegador no tiene estado inicial que animar.
        reverso.hidden = false;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { tarjeta.dataset.volteada = "true"; });
        });
        frente.setAttribute("tabindex", "-1");
        // deja terminar el giro antes de mover el foco
        setTimeout(function () {
          var primero = reverso.querySelector("a, button");
          if (primero) primero.focus({ preventScroll: true });
        }, quieto ? 0 : GIRO / 2);
      } else {
        tarjeta.dataset.volteada = "false";
        frente.removeAttribute("tabindex");
        frente.focus({ preventScroll: true });
        setTimeout(function () {
          // si la volvieron a abrir durante el giro, no la escondas
          if (tarjeta.dataset.volteada === "false") reverso.hidden = true;
        }, quieto ? 0 : GIRO);
      }
    }

    frente.addEventListener("click", function () { voltear(true); });
    // Tocar cualquier parte del reverso (el botón "Volver" incluido)
    // regresa la tarjeta; solo el enlace del mapa hace lo suyo.
    reverso.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (tarjeta.dataset.volteada === "true") voltear(false);
    });
    tarjeta.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && tarjeta.dataset.volteada === "true") voltear(false);
    });
  });

  /* ─── Barra de avance de lectura ────────────────────────── */
  var avance = null;
  if (!quieto) {
    avance = document.createElement("div");
    avance.className = "avance";
    avance.setAttribute("aria-hidden", "true");
    avance.innerHTML = "<i></i>";
    document.body.appendChild(avance);
  }

  /* ─── Polaroids que se inclinan con el mouse ────────────── */
  // Solo con mouse: en teléfono no hay hover y el gesto estorbaría al scroll.
  var grupoFotos = document.querySelector(".polaroides");
  if (grupoFotos && !quieto && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var fotos = Array.prototype.slice.call(grupoFotos.querySelectorAll(".polaroide"));
    var PROFUNDIDAD = [7, -11];   // px de parallax por foto: se mueven en sentidos opuestos
    var INCLINA = 12;             // grados máximos de inclinación
    var puntero = null, pendiente = false;

    function inclinar() {
      pendiente = false;
      var caja = grupoFotos.getBoundingClientRect();
      fotos.forEach(function (f, i) {
        var s = f.style;
        if (!puntero) {
          ["--ix", "--iy", "--dx", "--dy"].forEach(function (v) { s.removeProperty(v); });
          f.classList.remove("inclinada");
          return;
        }
        var nx = (puntero.x - caja.left) / caja.width * 2 - 1;
        var ny = (puntero.y - caja.top) / caja.height * 2 - 1;
        s.setProperty("--dx", (nx * PROFUNDIDAD[i]).toFixed(1) + "px");
        s.setProperty("--dy", (ny * PROFUNDIDAD[i]).toFixed(1) + "px");
        var encima = puntero.foto === f;
        f.classList.toggle("inclinada", encima);
        if (encima) {
          var r = f.getBoundingClientRect();
          var lx = (puntero.x - r.left) / r.width * 2 - 1;
          var ly = (puntero.y - r.top) / r.height * 2 - 1;
          s.setProperty("--iy", (lx * INCLINA).toFixed(2) + "deg");
          s.setProperty("--ix", (-ly * INCLINA).toFixed(2) + "deg");
        } else {
          s.removeProperty("--ix"); s.removeProperty("--iy");
        }
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(inclinar); } }

    grupoFotos.addEventListener("pointermove", function (e) {
      puntero = { x: e.clientX, y: e.clientY, foto: e.target.closest(".polaroide") };
      pedir();
    });
    grupoFotos.addEventListener("pointerleave", function () { puntero = null; pedir(); });
  }

  /* ─── Parallax suave en las fotos a sangre ──────────────── */
  var capasParallax = quieto ? [] : [
    { el: document.querySelector(".portada__foto"), factor: 0.28 },
    { el: document.querySelector(".vestimenta__foto"), factor: 0.16 }
  ].concat(Array.prototype.map.call(document.querySelectorAll(".cinta__foto"), function (el) {
    return { el: el, factor: 0.07 };   // la foto sobra 20 % arriba y abajo: alcanza
  })).filter(function (c) { return c.el; });

  function moverParallax() {
    for (var i = 0; i < capasParallax.length; i++) {
      var c = capasParallax[i];
      var caja = c.el.parentElement.getBoundingClientRect();
      if (caja.bottom < -200 || caja.top > window.innerHeight + 200) continue;
      var centro = caja.top + caja.height / 2 - window.innerHeight / 2;
      c.el.style.transform = "translate3d(0," + (-centro * c.factor) + "px,0)";
    }
  }

  /* ─── Hilo del itinerario ───────────────────────────────── */
  var hilo = document.getElementById("lineaHilo");
  var linea = document.querySelector(".linea");

  function dibujarHilo() {
    if (!hilo || !linea) return;
    var caja = linea.getBoundingClientRect();
    var recorrido = (window.innerHeight * 0.72 - caja.top) / caja.height;
    hilo.style.height = Math.max(0, Math.min(1, recorrido)) * 100 + "%";
  }

  function dibujarAvance() {
    if (!avance) return;
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var pct = alto > 0 ? Math.max(0, Math.min(1, y / alto)) : 0;
    avance.firstChild.style.width = (pct * 100) + "%";
    avance.dataset.visible = y > 120 ? "true" : "false";
  }

  if (!quieto) {
    var pendiente = false;
    function enScroll() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        dibujarHilo();
        dibujarAvance();
        moverParallax();
        pendiente = false;
      });
    }
    window.addEventListener("scroll", enScroll, { passive: true });
    window.addEventListener("resize", enScroll, { passive: true });
    enScroll();
  } else if (hilo) {
    hilo.style.height = "100%";
  }

  /* ─── Pases por código de invitación ────────────────────── */
  // ?i=k7m2xq9a&nombre=Familia%20Ochoa
  // El código se convierte en hash y se busca en window.INVITACIONES
  // (js/invitaciones.js, generado por herramientas/invitaciones.py).
  // Código válido → "N pases", el nombre bajo el título y un bloque del formulario
  // por invitado. Sin código o con uno que no existe → solo el aviso de
  // "Invitación personal": sin pases ni formulario.
  var SAL_CODIGO = "angelica-zaid-2026";   // igual que SAL en invitaciones.py
  var VUELTAS_CODIGO = 60000;              // igual que VUELTAS en invitaciones.py
  var consulta = new URLSearchParams(location.search);
  var codigoInvitacion = (consulta.get("i") || "").trim().toLowerCase();
  var nombreInvitado = (consulta.get("nombre") || "").trim().slice(0, 60);
  var totalPases = 0;   // 0 = invitación genérica

  function aHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return (b < 16 ? "0" : "") + b.toString(16);
    }).join("");
  }

  function codigoAHash(codigo) {
    var sutil = window.crypto && window.crypto.subtle;
    if (!sutil || !window.TextEncoder) return Promise.reject(new Error("sin WebCrypto"));
    var cod = new TextEncoder();
    return sutil.importKey("raw", cod.encode(codigo), "PBKDF2", false, ["deriveBits"])
      .then(function (llave) {
        return sutil.deriveBits({ name: "PBKDF2", hash: "SHA-256",
          salt: cod.encode(SAL_CODIGO), iterations: VUELTAS_CODIGO }, llave, 256);
      })
      .then(aHex);
  }

  function armarFormulario(n) {
    // El bloque "Invitado 2" es el molde para los demás
    var molde = document.querySelector("[data-invitado]");
    if (!molde) return;
    var ancla = molde.nextElementSibling;
    var padre = molde.parentNode;
    padre.removeChild(molde);
    for (var i = 2; i <= n; i++) {
      var copia = molde.cloneNode(true);
      copia.querySelector("legend").textContent = "Invitado " + i;
      Array.prototype.forEach.call(copia.querySelectorAll("[id]"), function (el) {
        var nuevo = el.id.replace(/\d+$/, i);
        var etiqueta = copia.querySelector('label[for="' + el.id + '"]');
        if (etiqueta) etiqueta.setAttribute("for", nuevo);
        el.id = nuevo;
        el.name = nuevo;
      });
      padre.insertBefore(copia, ancla);
    }
  }

  function aplicarPases(n) {
    totalPases = n;
    var aviso = document.getElementById("sinInvitacion");
    var reserva = document.getElementById("conInvitacion");
    if (!n) {
      if (aviso) aviso.hidden = false;
      document.getElementById("confirmar").setAttribute("aria-labelledby", "avisoTitulo");
      return;
    }
    if (reserva) reserva.hidden = false;
    armarFormulario(n);

    var num = document.querySelector(".pases__num");
    var eti = document.querySelector(".pases__eti");
    num.textContent = n;
    eti.textContent = n === 1 ? "pase" : "pases";
    document.querySelector(".pases").hidden = false;

    var para = document.getElementById("paraQuien");
    if (para && nombreInvitado) {
      para.textContent = nombreInvitado;   // textContent: nunca HTML del link
      para.hidden = false;
    }
    contarPases(num, n);
  }

  var tabla = window.INVITACIONES || {};
  if (/^[a-z0-9]{4,20}$/.test(codigoInvitacion)) {
    codigoAHash(codigoInvitacion).then(function (h) {
      var n = tabla[h];
      aplicarPases(typeof n === "number" ? n : 0);
    }).catch(function () { aplicarPases(0); });
  } else {
    aplicarPases(0);
  }

  /* ─── El número de pases cuenta hacia arriba ────────────── */
  function contarPases(nodo, meta) {
    if (quieto || !("IntersectionObserver" in window)) return;
    nodo.textContent = "0";
    new IntersectionObserver(function (ent, obs) {
      if (!ent[0].isIntersecting) return;
      obs.disconnect();
      var n = 0;
      var paso = setInterval(function () {
        n += 1;
        nodo.textContent = n;
        if (n >= meta) clearInterval(paso);
      }, Math.max(90, Math.min(400, 900 / meta)));
    }, { threshold: .6 }).observe(nodo);
  }

  /* ─── Copiar CLABE / tarjeta ────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll("[data-copia]"), function (boton) {
    boton.addEventListener("click", function () {
      var origen = document.querySelector(boton.dataset.copia);
      if (!origen) return;
      var texto = origen.textContent.trim();
      var listo = function () {
        var antes = boton.textContent;
        boton.textContent = "Copiado";
        boton.dataset.listo = "true";
        setTimeout(function () {
          boton.textContent = antes;
          boton.dataset.listo = "false";
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(listo).catch(function () {});
      } else {
        var tmp = document.createElement("textarea");
        tmp.value = texto;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand("copy"); listo(); } catch (e) {}
        document.body.removeChild(tmp);
      }
    });
  });

  /* ─── Galería: "Ver todas las fotos" ────────────────────── */
  var extras = Array.prototype.slice.call(document.querySelectorAll(".mosaico [data-extra]"));
  var verTodas = document.getElementById("verTodas");
  if (verTodas && extras.length) {
    verTodas.textContent = "Ver todas las fotos (" + document.querySelectorAll(".mosaico li").length + ")";
    verTodas.hidden = false;
    verTodas.addEventListener("click", function () {
      extras.forEach(function (li) { li.hidden = false; });
      verTodas.hidden = true;
      // el foco pasa a la primera foto nueva para no perderlo con el botón
      extras[0].querySelector("button").focus({ preventScroll: true });
    });
  }

  /* ─── Visor de galería ──────────────────────────────────── */
  var piezas = Array.prototype.slice.call(document.querySelectorAll("[data-abre]"));
  var visor = document.getElementById("visor");
  var visorImg = document.getElementById("visorImg");
  var visorPie = document.getElementById("visorPie");
  var actual = 0;
  var origenFoco = null;

  function mostrar(i) {
    if (!piezas.length) return;
    actual = (i + piezas.length) % piezas.length;
    var img = piezas[actual].querySelector("img");
    visorImg.src = img.dataset.grande || img.currentSrc || img.src;
    visorImg.alt = img.alt;
    visorPie.textContent = (actual + 1) + " de " + piezas.length;
  }

  function abrirVisor(i) {
    origenFoco = document.activeElement;
    mostrar(i);
    visor.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { visor.dataset.abierto = "true"; });
    });
    document.body.style.overflow = "hidden";
    document.getElementById("visorCerrar").focus({ preventScroll: true });
  }

  function cerrarVisor() {
    visor.dataset.abierto = "false";
    document.body.style.overflow = "";
    setTimeout(function () { visor.hidden = true; }, quieto ? 0 : 300);
    if (origenFoco) origenFoco.focus({ preventScroll: true });
  }

  if (visor && piezas.length) {
    piezas.forEach(function (p, i) {
      p.addEventListener("click", function () { abrirVisor(i); });
    });
    document.getElementById("visorCerrar").addEventListener("click", cerrarVisor);
    document.getElementById("visorPrev").addEventListener("click", function () { mostrar(actual - 1); });
    document.getElementById("visorSig").addEventListener("click", function () { mostrar(actual + 1); });

    visor.addEventListener("click", function (e) {
      if (e.target === visor) cerrarVisor();
    });

    document.addEventListener("keydown", function (e) {
      if (visor.hidden) return;
      if (e.key === "Escape") cerrarVisor();
      if (e.key === "ArrowLeft") mostrar(actual - 1);
      if (e.key === "ArrowRight") mostrar(actual + 1);
      if (e.key === "Tab") {
        // mantiene el foco dentro del visor
        var focoables = visor.querySelectorAll("button");
        var primero = focoables[0];
        var ultimo = focoables[focoables.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    });

    // Deslizar en táctil
    var xInicio = null;
    visor.addEventListener("touchstart", function (e) { xInicio = e.touches[0].clientX; }, { passive: true });
    visor.addEventListener("touchend", function (e) {
      if (xInicio === null) return;
      var dx = e.changedTouches[0].clientX - xInicio;
      if (Math.abs(dx) > 55) mostrar(actual + (dx < 0 ? 1 : -1));
      xInicio = null;
    }, { passive: true });
  }

  /* ─── Formulario de confirmación ────────────────────────── */
  var forma = document.getElementById("forma");
  var aviso = document.getElementById("formaAviso");

  function errorDe(id) { return document.querySelector('[data-error-de="' + id + '"]'); }

  function marcar(campo, mensaje) {
    var caja = errorDe(campo.id);
    if (mensaje) {
      campo.setAttribute("aria-invalid", "true");
      if (caja) { caja.textContent = mensaje; caja.hidden = false; }
    } else {
      campo.removeAttribute("aria-invalid");
      if (caja) { caja.textContent = ""; caja.hidden = true; }
    }
  }

  if (forma) {
    ["n1", "a1"].forEach(function (id) {
      var campo = document.getElementById(id);
      if (campo) campo.addEventListener("input", function () { marcar(campo, ""); });
    });

    forma.addEventListener("submit", function (e) {
      e.preventDefault();

      var n1 = document.getElementById("n1");
      var a1 = document.getElementById("a1");
      var falla = null;

      if (!n1.value.trim()) { marcar(n1, "Necesitamos tu nombre para buscarte en la lista."); falla = falla || n1; }
      if (!a1.value) { marcar(a1, "Elige si nos acompañas."); falla = falla || a1; }

      if (falla) {
        aviso.textContent = "";
        falla.focus();
        return;
      }

      // ── ENVÍO ──────────────────────────────────────────────
      // Si DESTINO trae una URL (Formspree, Apps Script, etc.) se manda ahí.
      // Si está vacío, cae al respaldo: abre WhatsApp con el mensaje listo,
      // así el formulario NUNCA se queda sin hacer nada.
      var datos = {};
      new FormData(forma).forEach(function (v, k) { datos[k] = v; });

      var boton = forma.querySelector('button[type="submit"]');
      boton.disabled = true;
      aviso.textContent = "Enviando…";

      function bien() {
        aviso.textContent = a1.value === "si"
          ? "¡Listo! Te esperamos el 26 de diciembre."
          : "Gracias por avisarnos. Te vamos a extrañar.";
      }

      // Si falla el registro, no se abre WhatsApp solo: tras la espera del
      // envío el navegador bloquearía la ventana. Se ofrece un botón.
      function mal() {
        boton.disabled = false;
        aviso.textContent = "No pudimos guardar tu confirmación. Envíala por WhatsApp:";
        var liga = document.createElement("a");
        liga.className = "boton boton--linea forma__whatsapp";
        liga.href = ligaWhatsApp();
        liga.target = "_blank";
        liga.rel = "noopener";
        liga.textContent = "Enviar por WhatsApp";
        liga.addEventListener("click", bien);
        aviso.appendChild(liga);
      }

      function porWhatsApp() {
        window.open(ligaWhatsApp(), "_blank");
        bien();
      }

      function ligaWhatsApp() {
        var t = "Confirmación de asistencia — Boda Angélica y Zaid\n";
        if (nombreInvitado) t += "Invitación: " + nombreInvitado + "\n";
        t += "Código: " + codigoInvitacion + " · Pases: " + totalPases + "\n\n";
        t += "Invitado 1: " + datos.n1 + "\n";
        t += "Teléfono: " + (datos.t1 || "—") + "\n";
        t += "Asiste: " + (datos.a1 === "si" ? "Sí" : "No") + "\n";
        for (var i = 2; i <= totalPases; i++) {
          if (!datos["n" + i]) continue;
          var va = datos["a" + i];
          t += "\nInvitado " + i + ": " + datos["n" + i] + "\n";
          t += "Teléfono: " + (datos["t" + i] || "—") + "\n";
          t += "Asiste: " + (va === "si" ? "Sí" : va === "no" ? "No" : "—") + "\n";
        }
        if (datos.deseos) t += "\nMensaje: " + datos.deseos;
        return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(t);
      }

      if (!DESTINO) { porWhatsApp(); return; }

      // Como formulario urlencoded: Apps Script lo lee en e.parameter
      // (multipart no). Se agregan el código y los pases de la invitación.
      var cuerpo = new URLSearchParams();
      Object.keys(datos).forEach(function (k) { cuerpo.append(k, datos[k]); });
      cuerpo.append("codigo", codigoInvitacion);
      cuerpo.append("pases", totalPases);

      fetch(DESTINO, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: cuerpo
      }).then(function (r) {
        if (!r.ok) throw new Error("respuesta " + r.status);
        return r.json();
      }).then(function (j) {
        if (!j || !j.ok) throw new Error("rechazado");
        bien();
      }).catch(mal);

      return;
    });
  }

})();
