# Setup del Board — paso a paso

De cero hasta `tu-usuario.github.io/yodesarrollo-board` funcionando, leyendo datos en vivo del Sheet.

Tiempo estimado: **45–60 min** la primera vez. Después, cada cambio es 10 segundos.

---

## 0 · Lo que necesitas tener antes

- Chromebook con **Linux activado** (Settings → Advanced → Developers → Linux development environment)
- Cuenta de **GitHub** (gratis, github.com)
- Cuenta de **Google** con acceso a Sheets y Apps Script (la que ya usas para Drive)

---

## 1 · Preparar la terminal del Chromebook

Abre la app **Terminal** (la verde con icono de consola).

```bash
sudo apt update
sudo apt install -y git
git --version
```

Configura tu identidad de git (la primera vez):

```bash
git config --global user.name "Alejandro Puebla"
git config --global user.email "tu-correo-github@gmail.com"
```

---

## 2 · Conectar tu Chromebook a GitHub con SSH

Genera una llave (acepta los defaults presionando Enter en cada pregunta, y deja contraseña vacía si quieres simpleza):

```bash
ssh-keygen -t ed25519 -C "chromebook-yodesarrollo"
```

Muestra la llave pública:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copia toda la línea que empieza con `ssh-ed25519 …`.

En GitHub, ve a: **Settings → SSH and GPG keys → New SSH key**. Pégala, dale nombre "Chromebook".

Prueba que funciona:

```bash
ssh -T git@github.com
```

Debe responder algo como `Hi tu-usuario! You've successfully authenticated`.

---

## 3 · Crear el repo en GitHub

En GitHub: **+ (arriba derecha) → New repository**

- **Name:** `yodesarrollo-board`
- **Public** (necesario para GitHub Pages gratis)
- **No** marques "Add a README" (lo subimos nosotros)

Después de crear, GitHub te muestra la URL SSH:
`git@github.com:tu-usuario/yodesarrollo-board.git`

---

## 4 · Clonar el repo vacío en tu Chromebook

```bash
cd ~
git clone git@github.com:tu-usuario/yodesarrollo-board.git
cd yodesarrollo-board
```

---

## 5 · Copiar los archivos del board

Tienes todos los archivos del proyecto en una carpeta descargada de esta conversación (los voy a presentar al final con `present_files`).

Mueve todo el contenido a tu repo:

```bash
# Asumiendo que los archivos están en ~/Downloads/yodesarrollo-board/
cp -r ~/Downloads/yodesarrollo-board/* ~/yodesarrollo-board/

# Verifica que todo esté
cd ~/yodesarrollo-board
ls -la
```

Debes ver:
```
app.jsx
apps-script/
   Code.gs
   seed-sheet.gs
assets/
data.json
data-loader.jsx
icons.jsx            ← copia desde el upload original (no cambió)
index.html
lote-selector.css    ← copia desde el upload original (no cambió)
lote-selector.jsx
README.md
sections.jsx
SETUP-GUIDE.md
styles.css           ← copia desde el upload original (no cambió)
styles-data.css
tweaks-panel.jsx     ← copia desde el upload original (no cambió)
```

**Importante:** los archivos `icons.jsx`, `tweaks-panel.jsx`, `styles.css`, `lote-selector.css` y la carpeta `assets/` son los que ya tenías — yo no los toqué, solo los necesitas ahí.

---

## 6 · Crear el Google Sheet `Yodesarrollo-Board`

1. Ve a `sheets.google.com → +` (nuevo Sheet en blanco).
2. Renómbralo en la barra superior: **Yodesarrollo-Board**.
3. Menú **Extensiones → Apps Script**.
4. Borra el `function myFunction() {}` que viene por defecto.
5. En el archivo `Código.gs` (a veces se llama `Code.gs`): pega TODO el contenido de `apps-script/Code.gs`.
6. Abajo, en el panel "Archivos", clic en **+ → Script**. Llámalo `seed-sheet`. Pega TODO el contenido de `apps-script/seed-sheet.gs`.
7. Guarda con `Ctrl+S` (los dos archivos).

### Correr el seed

1. En la barra de arriba, donde dice "Función a ejecutar", elige **`seedAll`**.
2. Clic en **▶ Ejecutar**.
3. Google te pedirá **autorizar permisos**. Procede: "Revisar permisos" → tu cuenta → "Avanzado" → "Ir a (proyecto sin verificar)" → "Permitir". (Es seguro: el script solo toca *tu propio* Sheet.)
4. Vuelve al Sheet. Verás **27 pestañas** creadas con datos semilla.

---

## 7 · Desplegar el Apps Script como Web App

De vuelta en el editor de Apps Script:

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Ícono ⚙ al lado de "Selecciona el tipo" → **Aplicación web**.
3. Configura:
   - **Descripción:** "Yodesarrollo Board v1"
   - **Ejecutar como:** *Yo* (`tu-correo@gmail.com`)
   - **Quién tiene acceso:** **Cualquier persona**
4. Clic en **Implementar**.
5. Te muestra una **URL de aplicación web** que termina en `/exec`. **Cópiala completa.**

Pruébala pegándola en una pestaña nueva del navegador. Debes ver un JSON enorme con `"ok": true` y todos tus datos.

---

## 8 · Pegar la URL en el board

Edita `index.html` (en tu Chromebook):

```bash
nano ~/yodesarrollo-board/index.html
```

Busca:
```html
window.YDR_CONFIG = {
  appsScriptUrl: ""
};
```

Reemplaza con tu URL:
```html
window.YDR_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec"
};
```

Guarda: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 9 · Subir todo a GitHub

```bash
cd ~/yodesarrollo-board
git add .
git commit -m "Initial board with Sheets integration"
git push origin main
```

Si te pide `main` vs `master` y dice que no existe la rama, corre:

```bash
git branch -M main
git push -u origin main
```

---

## 10 · Activar GitHub Pages

En GitHub, ve a tu repo `yodesarrollo-board`:

1. **Settings → Pages** (en la columna izquierda).
2. **Source:** Deploy from a branch.
3. **Branch:** `main` · folder `/ (root)` · **Save**.
4. Espera 1–2 min. Refresca la página. Verás:

> Your site is live at `https://tu-usuario.github.io/yodesarrollo-board/`

Ábrela. Si todo está bien, **el board carga datos en vivo desde tu Sheet**.

En la esquina inferior derecha NO debe aparecer el badge (señal de que está usando la fuente "live"). Si aparece "caché local" u "offline · data.json", clic ahí para forzar recarga.

---

## 11 · Cómo editar contenido desde el Sheet (uso día a día)

### Cambiar un número o texto

1. Abre tu Sheet `Yodesarrollo-Board`.
2. Ve a la pestaña que corresponda (ej. `Alysa-Hero` para el copy de Casa Alysa).
3. Cambia la celda.
4. **Importante:** los cambios tardan máximo **5 minutos** en aparecer (caché). Para forzar:
   - En el board, clic en el badge "caché local" abajo a la derecha
   - O abre `?refresh=1` al final de la URL del Apps Script
   - O usa el menú **Yodesarrollo Board → Limpiar caché** en el Sheet

### Cambiar una imagen (logo, render, master plan)

1. Sube la imagen a tu Google Drive.
2. Clic derecho en la imagen → **Compartir → "Cualquiera con el enlace"** → Copiar enlace.
3. Pega el enlace en la celda correspondiente del Sheet:
   - `Config.logo_url` → logo del header
   - `Alysa-Hero.img_url` → render de Casa Alysa
   - `Miramar-Hero.master_plan_url` → plano maestro de Real Miramar
4. El Apps Script convierte automáticamente el link al formato que las imágenes necesitan. No tienes que hacer nada más.

### Agregar un lote nuevo

En la pestaña `Miramar-Lotes`, agrega una fila al final con: `n, m2, uso, x, y, status`.

Si necesitas reposicionar marcadores en el plano: en el board, entra a Real Miramar, clic en "✎ Ajustar", arrastra los marcadores, luego "Ver coords → 📋 Copiar", y pega de regreso en la pestaña `Miramar-Lotes`.

### Ver respuestas del Diagnóstico

Pestaña `Diagnostico-Respuestas` — cada vez que alguien usa el diagnóstico en el board y le da "Guardar respuestas", aparece una fila nueva con timestamp.

---

## 12 · Cambios futuros al código

Cualquier ajuste a `.jsx`, `.html` o CSS:

```bash
cd ~/yodesarrollo-board
nano sections.jsx          # o el archivo que sea
git add .
git commit -m "Ajuste copy Garantías"
git push
```

GitHub Pages re-despliega en ~30 segundos. Refresca el board y listo.

---

## Troubleshooting rápido

| Problema | Causa probable | Solución |
|---|---|---|
| El board queda en "Cargando board…" eterno | URL del Apps Script mal pegada o el script no está desplegado | Verifica `YDR_CONFIG.appsScriptUrl`. Pruébala en una pestaña nueva — debe devolver JSON con `"ok": true` |
| Aparece "offline · data.json" en el badge | El Apps Script no respondió en 3 seg o falló | Verifica el deployment. A veces Google tarda en propagar la URL los primeros minutos |
| Cambios al Sheet no aparecen | Caché de 5 min | Menú **Yodesarrollo Board → Limpiar caché** en el Sheet. O clic en el badge inferior derecho del board |
| Las imágenes no cargan | El link de Drive no está como "cualquiera con el enlace" | Cambia el permiso a público. El Apps Script no puede leer archivos privados |
| Error CORS al guardar diagnóstico | Apps Script desplegado con acceso restringido | En Implementar → Administrar implementaciones → editar → "Quién tiene acceso" = Cualquier persona |
| El board no se actualiza al hacer push | Hard refresh del navegador | `Ctrl+Shift+R` (limpia caché del navegador) |
| Mensaje "fatal: no upstream branch" al hacer push | Primer push de la rama | `git push -u origin main` |

---

## Estructura del Sheet (referencia rápida)

| Pestaña | Qué controla |
|---|---|
| **Config** | Logo, marca, footer, stats del header |
| **Tiles** | Los 10 botones del board (orden, color, kicker, badge) |
| **Diagnostico-Form** | Preguntas del formulario inicial |
| **Diagnostico-Respuestas** | Salidas del form (no editar manualmente, append-only) |
| **Comparativo** | Tabla de instrumentos vs Yodesarrollo |
| **Alysa-Hero** | Copy del header de Casa Alysa + render |
| **Alysa-Tiers** | Tabla escalonada de capital × tasa |
| **Alysa-PorQue**, **Alysa-Como** | Bullets explicativos |
| **Miramar-Hero** | Stats del header + plano maestro + precio comercial |
| **Miramar-Etapas** | Las 5 etapas de precios ($/m²) |
| **Miramar-Lotes** | Los 47 lotes (coordenadas + status) |
| **Miramar-Urbanismo**, **Miramar-LoteEjemplo** | Detalle expandible |
| **Calc-Alysa-Brackets** | Tasas escalonadas de la calculadora |
| **Calc-Miramar-Config** | Plusvalía 24m, rango del slider |
| **Estrategia-Hero**, **Estrategia-Steps** | Timeline de la estrategia combinada |
| **Garantias-Hero**, **Garantias-Cards** | Las 5 garantías |
| **Cronograma-*** (8 pestañas) | Hitos visuales de la línea de tiempo |
| **Decision-Hero**, **Decision-Paths** | Los 4 caminos de cierre |
| **Contacto-*** (4 pestañas) | Datos del asesor, docs, CTA |

---

## Costos

- **GitHub Pages:** gratis (repos públicos)
- **Google Sheets + Apps Script:** gratis (cuota personal: 30,000 ejecuciones/día, suficiente para cientos de reuniones)
- **Dominio personalizado:** opcional ($10–15 USD/año si quieres `board.yodesarrollo.mx` en lugar de `tu-usuario.github.io/yodesarrollo-board`)

---

Cualquier paso atorado, mándame screenshot del error y lo destrabamos.
