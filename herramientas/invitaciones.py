#!/usr/bin/env python3
"""Genera los códigos de invitación y js/invitaciones.js.

Uso:  python3 herramientas/invitaciones.py

Lee referencia/invitados.csv (fuera del repo: trae nombres) con columnas
    nombre,pases,codigo   (más las columnas extra que quieras: se conservan)
- Las filas sin código reciben uno nuevo; los códigos existentes NO cambian,
  así los links que ya se enviaron siguen sirviendo.
- Reescribe el CSV con los códigos y una columna "link" lista para copiar.
  El link lleva solo el código: "nombre" es una etiqueta interna para saber a
  quién mandarlo; los invitados escriben sus propios nombres en el formulario.
- Escribe referencia/para-sheets.csv, la lista para importar en la hoja de Google.
- Escribe js/invitaciones.js solo con el hash de cada código y sus pases:
  sin nombres, y sin forma práctica de sacar los códigos del hash.

El hash debe coincidir con codigoAHash() en js/app.js (PBKDF2-SHA256).
"""
import csv, hashlib, secrets, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LISTA = RAIZ / "referencia" / "invitados.csv"
SALIDA = RAIZ / "js" / "invitaciones.js"
SHEETS = RAIZ / "referencia" / "para-sheets.csv"   # lista para la hoja de Google (ver REGISTRO.md)
SITIO = "https://villacode.github.io/sitio-angelica-zaid/"

SAL = b"angelica-zaid-2026"      # igual que SAL_CODIGO en app.js
VUELTAS = 60000                  # igual que VUELTAS_CODIGO en app.js
ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"   # sin 0/o, 1/l/i
LARGO = 8
PASES_MAX = 10


def hash_de(codigo):
    return hashlib.pbkdf2_hmac("sha256", codigo.encode(), SAL, VUELTAS).hex()


def nuevo_codigo(usados):
    while True:
        c = "".join(secrets.choice(ALFABETO) for _ in range(LARGO))
        if c not in usados:
            return c


def main():
    if not LISTA.exists():
        sys.exit(f"No existe {LISTA}. Crea el CSV con columnas: nombre,pases,codigo")
    with LISTA.open(newline="", encoding="utf-8") as f:
        lector = csv.DictReader(f)
        filas = [r for r in lector if (r.get("nombre") or "").strip()]
    # Columnas extra (lado, familia, personas...) se conservan tal cual, al final.
    columnas = ["nombre", "pases", "codigo", "link"]
    columnas += [c for c in lector.fieldnames if c not in columnas]

    usados = {r["codigo"].strip() for r in filas if (r.get("codigo") or "").strip()}
    tabla = {}
    for r in filas:
        nombre = r["nombre"].strip()
        try:
            pases = int(r["pases"])
        except (TypeError, ValueError):
            sys.exit(f"Pases inválidos para {nombre!r}: {r.get('pases')!r}")
        if not 1 <= pases <= PASES_MAX:
            sys.exit(f"Pases fuera de rango (1–{PASES_MAX}) para {nombre!r}: {pases}")
        codigo = (r.get("codigo") or "").strip() or nuevo_codigo(usados)
        usados.add(codigo)
        r.update(nombre=nombre, pases=pases, codigo=codigo,
                 link=SITIO + "?i=" + codigo)
        tabla[hash_de(codigo)] = pases

    with LISTA.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columnas, extrasaction="ignore")
        w.writeheader()
        w.writerows(filas)

    with SHEETS.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["codigo", "invitacion", "pases", "personas", "lado"])
        for r in filas:
            w.writerow([r["codigo"], r["nombre"], r["pases"], r.get("personas", ""), r.get("lado", "")])

    lineas = ",\n".join(f'  "{h}": {p}' for h, p in sorted(tabla.items()))
    SALIDA.write_text(
        "/* Generado por herramientas/invitaciones.py — no editar a mano.\n"
        "   Hash de cada código de invitación → pases. Sin nombres. */\n"
        "window.INVITACIONES = {\n" + lineas + "\n};\n", encoding="utf-8")
    print(f"{len(filas)} invitaciones · {sum(r['pases'] for r in filas)} pases → {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
