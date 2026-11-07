/* ═══════════════════════════════════════════════════════════
   Angélica & Zaid — registro de confirmaciones en Google Sheets
   Se pega en la hoja de cálculo: Extensiones → Apps Script.
   Pasos completos en herramientas/REGISTRO.md.

   Pestañas:
     Invitaciones  la lista (se importa de referencia/para-sheets.csv)
     Respuestas    una fila por persona; la respuesta más reciente de
                   cada código reemplaza a la anterior
     Historial     cada envío tal cual llegó, por si algo sale mal
     Resumen       totales y quién falta por responder
   ═══════════════════════════════════════════════════════════ */

var AVISAR_POR_CORREO = true;   // un correo por cada confirmación
var PASES_MAX = 10;

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

  var resp = hoja(libro, "Respuestas", ENC_RESPUESTAS);
  hoja(libro, "Historial", ENC_HISTORIAL);
  resp.getRange("A:A").setNumberFormat("dd/mm/yyyy hh:mm");
  resp.getRange("B:B").setNumberFormat("@");   // los códigos siempre como texto
  inv.getRange("A:A").setNumberFormat("@");

  var res = libro.getSheetByName("Resumen") || libro.insertSheet("Resumen", 0);
  res.clear();
  res.getRange("A1:B7").setValues([
    ["Resumen", ""],
    ["Invitaciones enviadas", "=COUNTA(Invitaciones!A2:A)"],
    ["Pases en total", "=SUM(Invitaciones!C2:C)"],
    ["Invitaciones que ya respondieron", "=COUNTUNIQUE(Respuestas!B2:B)"],
    ["Invitaciones sin responder", "=B2-B4"],
    ["Personas que SÍ asisten", "=COUNTIF(Respuestas!H2:H,\"Sí\")"],
    ["Personas que NO asisten", "=COUNTIF(Respuestas!H2:H,\"No\")"]
  ]);
  res.getRange("A9:C9").setValues([["Sin responder", "Pases", "Lado"]]);
  res.getRange("A10").setFormula(
    '=IFERROR(FILTER({Invitaciones!B2:B,Invitaciones!C2:C,Invitaciones!E2:E},' +
    'Invitaciones!A2:A<>"",ISNA(MATCH(Invitaciones!A2:A,Respuestas!B2:B,0))),"Todas respondieron")');
  res.getRange("A1").setFontSize(14).setFontWeight("bold");
  res.getRange("A9:C9").setFontWeight("bold");
  res.setColumnWidth(1, 280);
  libro.setActiveSheet(res);
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

/* ── Prueba rápida: abrir la URL de la app web en el navegador ── */
function doGet() {
  return ContentService.createTextOutput("Registro activo ✔");
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
      [ahora, seguro(codigo), inv ? "Sí" : "NO: código desconocido", seguro(JSON.stringify(p))]);
    if (!inv) return json({ ok: false });

    // Los pases salen de la lista, nunca de lo que mande la página.
    var filas = [];
    for (var i = 1; i <= Math.min(inv.pases, PASES_MAX); i++) {
      var nombre = String(p["n" + i] || "").trim();
      if (!nombre) continue;
      var a = p["a" + i];
      filas.push([ahora, codigo, inv.nombre, inv.pases, i, seguro(nombre),
                  seguro(String(p["t" + i] || "").trim()),
                  a === "si" ? "Sí" : a === "no" ? "No" : "—",
                  i === 1 ? seguro(String(p.deseos || "").trim()) : ""]);
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
      return { nombre: datos[i][1], pases: Number(datos[i][2]) || 1 };
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
