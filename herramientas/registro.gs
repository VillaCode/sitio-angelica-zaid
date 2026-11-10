/* ═══════════════════════════════════════════════════════════
   Angélica & Zaid — registro de confirmaciones en Google Sheets
   Se pega en la hoja de cálculo: Extensiones → Apps Script.
   Pasos completos en herramientas/REGISTRO.md.

   ESTA HOJA ES LA FUENTE DE VERDAD de los pases: la página le pregunta
   cuántos pases tiene cada código (doGet ?i=). Cambiar un número aquí
   cambia la invitación en segundos, sin publicar nada.

   Pestañas:
     Estado        una fila por invitación: confirmó / no asiste / sin responder,
                   teléfono y su link para reenviarlo. Valores escritos por el script
                   (no fórmulas); menú Boda → Actualizar si algo no cuadra
     Invitaciones  la lista: codigo, invitacion, pases, personas, lado, link.
                   Fila nueva con "invitacion" y sin código → el código se pone solo.
                   Pases en 0 (o borrar la fila) = la invitación deja de servir.
     Respuestas    una fila por persona; la respuesta más reciente de
                   cada código reemplaza a la anterior
     Historial     cada envío tal cual llegó, por si algo sale mal
     Resumen       totales y quién falta por responder
   ═══════════════════════════════════════════════════════════ */

/**
 * @OnlyCurrentDoc  El script solo puede tocar ESTA hoja, no el resto de tu Drive.
 */

var AVISAR_POR_CORREO = true;   // un correo por cada confirmación
var PASES_MAX = 10;
var SITIO = "https://villacode.github.io/sitio-angelica-zaid/";
var ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";   // igual que herramientas/invitaciones.py

var ENC_RESPUESTAS = ["Fecha", "Código", "Invitación", "Pases", "#", "Nombre", "Teléfono", "Asiste", "Mensaje"];
var ENC_HISTORIAL  = ["Fecha", "Código", "Válido", "Datos recibidos"];

/* ── Se corre UNA vez a mano, después de importar la lista ── */
function preparar() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();

  // La importación deja la lista en una pestaña con otro nombre: se renombra.
  var inv = libro.getSheetByName("Invitaciones");
  if (!inv) {
    inv = libro.getSheets().filter(function (h) {
      return String(h.getRange("A1").getValue()).trim().toLowerCase() === "codigo";
    })[0];
    if (!inv) throw new Error("No encuentro la lista: importa primero para-sheets.csv (paso 2).");
    inv.setName("Invitaciones");
  }
  inv.setFrozenRows(1);
  // Columna F: el link completo, listo para copiar y pegar. Se escribe como texto
  // (no fórmula: la pestaña importada trae formato de texto y la mostraría tal cual).
  inv.getRange("F:F").clearContent();
  inv.getRange("F1").setValue("link").setFontWeight("bold");
  ponerLinks(inv);
  inv.setColumnWidth(6, 340);

  var resp = hoja(libro, "Respuestas", ENC_RESPUESTAS);
  hoja(libro, "Historial", ENC_HISTORIAL);
  resp.getRange("A:A").setNumberFormat("dd/mm/yyyy hh:mm");
  resp.getRange("B:B").setNumberFormat("@");   // los códigos siempre como texto
  inv.getRange("A:A").setNumberFormat("@");

  // Estado y Resumen se escriben como valores, no fórmulas: con la hoja en español
  // las fórmulas del script daban "Error de análisis de fórmula".
  actualizar(libro);
  libro.setActiveSheet(libro.getSheetByName("Estado"));
}

/* ── Menú "Boda" al abrir la hoja; también refresca Estado y Resumen ── */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Boda")
    .addItem("Actualizar Estado y Resumen", "actualizarAhora")
    .addToUi();
  try { actualizar(SpreadsheetApp.getActiveSpreadsheet()); } catch (err) {}
}

function actualizarAhora() {
  actualizar(SpreadsheetApp.getActiveSpreadsheet());
}

/* ── Reescribe Estado y Resumen con valores ──
   Se llama al abrir la hoja, con cada confirmación y al editar Invitaciones o Respuestas. */
function actualizar(libro) {
  var inv = libro.getSheetByName("Invitaciones");
  var resp = libro.getSheetByName("Respuestas");
  if (!inv || !resp) return;

  var lista = inv.getLastRow() > 1
    ? inv.getRange(2, 1, inv.getLastRow() - 1, 5).getValues()
        .filter(function (f) { return String(f[0]).trim(); })
    : [];

  // Respuestas por código: cuántos sí, cuántos no, fecha y teléfono
  var por = {};
  if (resp.getLastRow() > 1) {
    resp.getRange(2, 1, resp.getLastRow() - 1, 8).getValues().forEach(function (f) {
      var c = String(f[1]).trim().toLowerCase();
      if (!c) return;
      var r = por[c] || (por[c] = { si: 0, no: 0, fecha: "", tel: "" });
      if (f[7] === "Sí") r.si++;
      if (f[7] === "No") r.no++;
      if (f[0] && (!r.fecha || f[0] > r.fecha)) r.fecha = f[0];
      if (!r.tel && String(f[6]).trim()) r.tel = String(f[6]).trim();
    });
  }

  var filas = [], fondos = [], sinResponder = [];
  var tot = { pases: 0, respondieron: 0, si: 0, no: 0 };
  lista.forEach(function (f) {
    var c = String(f[0]).trim().toLowerCase();
    var pases = Math.floor(Number(f[2]) || 0);
    var r = por[c];
    var estado = !r ? "… Sin responder" : r.si > 0 ? "✔ Confirmó" : "✘ No asiste";
    filas.push([String(f[1]), pases, r ? r.si : 0, r ? r.no : 0, estado,
                r ? r.fecha : "", r ? r.tel : "", String(f[4]), SITIO + "?i=" + c]);
    var color = !r ? "#F6F1E7" : r.si > 0 ? "#DCE8D2" : "#F2D6D3";
    fondos.push([null, null, null, null, color, null, null, null, null]);
    tot.pases += pases;
    if (r) { tot.respondieron++; tot.si += r.si; tot.no += r.no; }
    else sinResponder.push([String(f[1]), pases, String(f[4])]);
  });

  var est = libro.getSheetByName("Estado") || libro.insertSheet("Estado", 0);
  est.clear();
  est.clearConditionalFormatRules();
  est.getRange("A1:I1").setValues([["Invitación", "Pases", "Asisten", "No asisten", "Estado",
                                     "Respondió", "Teléfono", "Lado", "Link"]]).setFontWeight("bold");
  if (filas.length) {
    // Columnas de texto como texto: un teléfono "+52…" o un nombre con "=" no se vuelven fórmula.
    [1, 7, 8, 9].forEach(function (k) { est.getRange(2, k, filas.length, 1).setNumberFormat("@"); });
    est.getRange(2, 1, filas.length, 9).setValues(filas).setBackgrounds(fondos);
    est.getRange(2, 6, filas.length, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  }
  est.setFrozenRows(1);
  est.setColumnWidth(1, 260); est.setColumnWidth(5, 130); est.setColumnWidth(9, 330);

  var res = libro.getSheetByName("Resumen") || libro.insertSheet("Resumen", 1);
  res.clear();
  res.getRange("A1:B8").setValues([
    ["Resumen", "Se actualiza solo (menú Boda → Actualizar si borras filas)"],
    ["Invitaciones", lista.length],
    ["Pases en total", tot.pases],
    ["Invitaciones que ya respondieron", tot.respondieron],
    ["Invitaciones sin responder", lista.length - tot.respondieron],
    ["Personas que SÍ asisten", tot.si],
    ["Personas que NO asisten", tot.no],
    ["Actualizado", new Date()]
  ]);
  res.getRange("B8").setNumberFormat("dd/mm/yyyy hh:mm");
  res.getRange("A10:C10").setValues([["Sin responder", "Pases", "Lado"]]);
  if (sinResponder.length) {
    res.getRange(11, 1, sinResponder.length, 1).setNumberFormat("@");
    res.getRange(11, 3, sinResponder.length, 1).setNumberFormat("@");
    res.getRange(11, 1, sinResponder.length, 3).setValues(sinResponder);
  }
  else res.getRange("A11").setValue("Todas respondieron");
  res.getRange("A1").setFontSize(14).setFontWeight("bold");
  res.getRange("B1").setFontColor("#888888");
  res.getRange("A10:C10").setFontWeight("bold");
  res.setColumnWidth(1, 280);
}

/* ── Fila nueva en Invitaciones (también desde el celular): le pone código ── */
function onEdit(e) {
  var h = e && e.range && e.range.getSheet();
  if (!h) return;
  if (h.getName() === "Respuestas") return actualizar(h.getParent());
  if (h.getName() !== "Invitaciones") return;
  var primera = Math.max(e.range.getRow(), 2), ultima = e.range.getLastRow();
  if (ultima < primera) return actualizar(h.getParent());
  var usados = {};
  h.getRange(2, 1, Math.max(h.getLastRow() - 1, 1), 1).getValues()
    .forEach(function (f) { usados[String(f[0]).trim().toLowerCase()] = true; });
  var filas = h.getRange(primera, 1, ultima - primera + 1, 2).getValues();
  filas.forEach(function (f, k) {
    if (String(f[0]).trim() || !String(f[1]).trim()) return;   // ya tiene código, o fila vacía
    var c;
    do {
      c = "";
      for (var i = 0; i < 8; i++) c += ALFABETO.charAt(Math.floor(Math.random() * ALFABETO.length));
    } while (usados[c]);
    usados[c] = true;
    h.getRange(primera + k, 1).setNumberFormat("@").setValue(c);
  });
  ponerLinks(h);
  actualizar(h.getParent());
}

// Columna F de Invitaciones: link de cada código (vacío si la fila no tiene código)
function ponerLinks(h) {
  var n = h.getLastRow() - 1;
  if (n < 1) return;
  var links = h.getRange(2, 1, n, 1).getValues().map(function (f) {
    var c = String(f[0]).trim().toLowerCase();
    return [c ? SITIO + "?i=" + c : ""];
  });
  h.getRange(2, 6, n, 1).setNumberFormat("@").setValues(links);
}

function hoja(libro, nombre, encabezados) {
  var h = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
  if (h.getLastRow() === 0) {
    h.appendRow(encabezados);
    h.getRange(1, 1, 1, encabezados.length).setFontWeight("bold");
    h.setFrozenRows(1);
  }
  return h;
}

/* ── La página pregunta los pases de un código: ?i=CODIGO ──
   Responde solo un número para ese código exacto: ni nombres ni la lista.
   Sin ?i= sirve de prueba rápida en el navegador. */
function doGet(e) {
  var codigo = String((e && e.parameter && e.parameter.i) || "").trim().toLowerCase();
  if (!codigo) return ContentService.createTextOutput("Registro activo ✔");
  if (!/^[a-z0-9]{4,20}$/.test(codigo)) return json({ ok: true, existe: false, pases: 0 });
  try {
    var inv = buscar(SpreadsheetApp.getActiveSpreadsheet(), codigo);
    return json({ ok: true, existe: !!inv, pases: inv ? Math.min(inv.pases, PASES_MAX) : 0 });
  } catch (err) {
    return json({ ok: false });   // la página usa su lista de respaldo
  }
}

/* ── Cada confirmación que manda la página ── */
function doPost(e) {
  var candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    var p = (e && e.parameter) || {};
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var codigo = String(p.codigo || "").trim().toLowerCase();
    var ahora = new Date();
    var inv = buscar(libro, codigo);

    libro.getSheetByName("Historial").appendRow(
      [ahora, seguro(codigo), inv ? "Sí" : "NO: código desconocido", seguro(JSON.stringify(p).slice(0, 5000))]);
    if (!inv) return json({ ok: false });

    // Los pases salen de la lista, nunca de lo que mande la página.
    var filas = [];
    for (var i = 1; i <= Math.min(inv.pases, PASES_MAX); i++) {
      var nombre = String(p["n" + i] || "").trim().slice(0, 120);
      if (!nombre) continue;
      var a = p["a" + i];
      filas.push([ahora, codigo, inv.nombre, inv.pases, i, seguro(nombre),
                  seguro(String(p["t" + i] || "").trim().slice(0, 40)),
                  a === "si" ? "Sí" : a === "no" ? "No" : "—",
                  i === 1 ? seguro(String(p.deseos || "").trim().slice(0, 2000)) : ""]);
    }

    // Si la misma invitación vuelve a confirmar, la nueva respuesta reemplaza a la vieja.
    var resp = libro.getSheetByName("Respuestas");
    var codigos = resp.getLastRow() > 1 ? resp.getRange(2, 2, resp.getLastRow() - 1, 1).getValues() : [];
    for (var r = codigos.length - 1; r >= 0; r--) {
      if (String(codigos[r][0]) === codigo) resp.deleteRow(r + 2);
    }
    if (filas.length) {
      resp.getRange(resp.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    }

    try { actualizar(libro); } catch (err) {}   // la respuesta ya quedó guardada
    if (AVISAR_POR_CORREO) avisar(inv, filas);
    return json({ ok: true });
  } finally {
    candado.releaseLock();
  }
}

function buscar(libro, codigo) {
  if (!codigo) return null;
  var h = libro.getSheetByName("Invitaciones");
  var datos = h.getRange(2, 1, Math.max(h.getLastRow() - 1, 1), 3).getValues();
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim().toLowerCase() === codigo) {
      var pases = Math.floor(Number(datos[i][2]) || 0);
      return pases >= 1 ? { nombre: datos[i][1], pases: pases } : null;   // 0 = cancelada
    }
  }
  return null;
}

function avisar(inv, filas) {
  try {
    var si = filas.filter(function (f) { return f[7] === "Sí"; }).length;
    var texto = filas.map(function (f) { return "• " + f[5] + ": " + f[7]; }).join("\n");
    if (filas.length && filas[0][8]) texto += "\n\nMensaje: " + filas[0][8];
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
      "Confirmación: " + inv.nombre + " (" + si + " de " + inv.pases + ")",
      texto + "\n\n" + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  } catch (err) {
    // El correo es opcional: si falla, la respuesta ya quedó guardada.
  }
}

// Evita que un texto que empieza con = + - @ se interprete como fórmula.
function seguro(t) {
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
