# Confirmaciones en Google Sheets: step by step

When the setup is finished, every RSVP sent from the page appears as rows in a private Google Sheet.
Only you and whoever you share it with can see it. Setting it up takes about 10 minutes, and you do it once.

Menu names are shown in English, with the Spanish name in parentheses.

## 1. Create the sheet

1. Open https://sheets.new while signed in to the Google account that should own the answers.
2. Click "Untitled spreadsheet" (Hoja de cálculo sin título) at the top left and name it
   `Boda A&Z — Confirmaciones`.

## 2. Import the guest list

1. In Google Sheets, go to **File → Import** (Archivo → Importar), choose **Upload** (Subir), and drag in
   `referencia/para-sheets.csv` from this project folder.
2. In the import window, set these options:
   - Import location (Ubicación de importación): **Replace spreadsheet** (Reemplazar hoja de cálculo)
   - Separator type (Tipo de separador): **Detect automatically** (Detectar automáticamente)
   - **Uncheck** "Convert text to numbers, dates, and formulas"
     (Convertir texto en números, fechas y fórmulas)
3. Click **Import data** (Importar datos). You should see 82 rows with these columns:
   codigo, invitacion, pases, personas, lado.

## 3. Paste the script

1. Go to **Extensions → Apps Script** (Extensiones → Apps Script). A new tab opens with a file
   called `Code.gs` (Código.gs).
2. Select everything in that file and delete it.
3. Paste the whole content of `herramientas/registro.gs`. To copy it, run
   `pbcopy < herramientas/registro.gs` in the terminal from the project folder.
4. Save with ⌘S, or click the disk icon.
5. Click "Untitled project" (Proyecto sin título) at the top and rename it `Registro boda`.

## 4. Run "preparar" once

1. In the toolbar, open the function menu next to "Debug" (Depurar) and choose **preparar**.
2. Click **Run** (Ejecutar).
3. Google asks for permission:
   1. Click **Review permissions** (Revisar permisos) and choose your account.
   2. You will see "Google hasn't verified this app" (Google no verificó esta app). This is normal,
      because you are the author of the script. Click **Advanced** (Configuración avanzada), then
      **Go to Registro boda (unsafe)** (Ir a Registro boda (no seguro)), then **Allow** (Permitir).
4. Go back to the sheet. It should now have four tabs:
   - **Resumen**: totals, and the list of invitations that have not answered yet
   - **Invitaciones**: your list
   - **Respuestas**: one row per person who answers
   - **Historial**: a backup of every submission, exactly as it arrived

## 5. Publish the script as a web app

1. In Apps Script, click **Deploy → New deployment** (Implementar → Nueva implementación).
2. Click the gear icon next to "Select type" (Seleccionar tipo) and choose **Web app** (Aplicación web).
3. Fill in the form:
   - Description (Descripción): `Registro boda`
   - Execute as (Ejecutar como): **Me** (Yo)
   - Who has access (Quién tiene acceso): **Anyone** (Cualquier usuario)

   "Anyone" only means the page can send answers to the script. Nobody can read the sheet through it.
4. Click **Deploy** (Implementar). If Google asks for permission again, allow it.
5. Copy the **Web app URL** (URL de la aplicación web). It ends in `/exec`.
6. Check it: paste the URL in a new browser tab. It should say **Registro activo ✔**.

## 6. Connect it to the page

Send that URL to Claude, or paste it yourself in `js/app.js` as the value of `DESTINO`.

Then test it on localhost with your own household link (`?i=whj9859t`, 4 passes):

1. Submit the form.
2. Check that the rows appear in **Respuestas** and that the confirmation email arrives.
3. Delete the test rows.

After that, say **"publica"**.

## 7. Share it with Angélica

In the sheet, click **Share** (Compartir), add her email as **Editor**, and leave "General access"
(Acceso general) as **Restricted** (Restringido).

## Good to know

- **The same invitation answers twice:** the newer answer replaces the older one in Respuestas.
  Historial keeps both.
- **Invented or mistyped codes:** they go only to Historial, marked "NO: código desconocido",
  and never reach Respuestas.
- **Number of guests:** passes come from your Invitaciones tab, not from the page. Nobody can
  register more people than their invitation has.
- **Email alerts:** you get one email per RSVP, sent to the account that owns the script.
  To turn them off, set `AVISAR_POR_CORREO = false` and redeploy (see the next point).
- **Changing the script later:** go to **Deploy → Manage deployments**
  (Implementar → Administrar implementaciones), click the pencil icon, set Version to **New version**
  (Nueva versión), then click **Deploy**. The URL stays the same. Do **not** use "New deployment"
  again, because that creates a different URL.
- **Adding an invitation later:**
  1. Add the row to `referencia/invitados.csv` and run `python3 herramientas/invitaciones.py`.
  2. Copy the new row from `referencia/para-sheets.csv` to the end of the **Invitaciones** tab.
  3. Publish.

  Never import again with "Replace spreadsheet": that would wipe the answers.
