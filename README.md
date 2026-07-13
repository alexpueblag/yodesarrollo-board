# Yodesarrollo-Board

Tablero de presentación 1-a-1 para reuniones con inversionistas de **Yodesarrollo SAPI**. Construido como app de una sola página, alimentado en vivo desde un **Google Sheet** vía Apps Script, alojado gratis en **GitHub Pages**.

> No es el portal de socios (ese es otro proyecto). Este es el **board de venta**: la herramienta que se proyecta en pantalla durante una reunión para guiar la conversación desde el diagnóstico hasta la decisión.

---

## Para qué sirve

- **Estructurar la reunión** en 4 actos: Diagnóstico → Comparativo → Tu Oportunidad → Decisión
- **Modelar números en vivo:** calculadora interactiva, selector de lotes, simulador combinado
- **Mantener todo el contenido editable** desde un Sheet sin tocar código (precios, copy, lotes, hasta imágenes)
- **Capturar respuestas del diagnóstico** automáticamente en una pestaña del Sheet

---

## Arquitectura

```
┌──────────────────────┐
│ Google Sheet         │   ← editas aquí
│ "Yodesarrollo-Board" │
│ · 27 pestañas        │
└──────────┬───────────┘
           │ Apps Script
           │  · doGet  → entrega JSON cacheado 5 min
           │  · doPost → guarda respuestas
           │  · driveUrl_() → convierte links Drive a imgs
           ▼
┌──────────────────────┐
│ /exec endpoint       │
│ JSON live            │
└──────────┬───────────┘
           │ fetch (3s timeout)
           ▼
┌──────────────────────┐    caché      ┌──────────────┐
│ React + Babel inline │ ─────────────▶│ localStorage │
│ (HTML, sin build)    │               │ (dispositivo)│
└──────────┬───────────┘               └──────────────┘
           │
           ▼
┌──────────────────────┐
│ tu-usuario.github.io │
│  /yodesarrollo-board │
└──────────────────────┘
```

**Acceso y datos:** toda la data sale del Apps Script y solo con una credencial válida del **Portero YOD** (liga mágica de 90 días, clave de equipo o Google), que el backend valida del lado del servidor. El repo no contiene datos ni secretos: el antiguo `data.json` público se retiró. Para arranque instantáneo el board pinta la caché local del dispositivo y revalida en segundo plano.

---

## Estructura de archivos

```
yodesarrollo-board/
├── index.html              ← Entry point. Pega aquí tu URL del Apps Script
├── app.jsx                 ← Shell + Dashboard + DataProvider wrap
├── sections.jsx            ← Las 10 secciones (todas data-driven)
├── lote-selector.jsx       ← Selector de lotes Real Miramar
├── data-loader.jsx         ← useData() hook + fetch híbrido + cache
├── icons.jsx               ← SVG icons (sin cambios desde upload original)
├── tweaks-panel.jsx        ← Panel de ajustes (sin cambios)
│
├── styles.css              ← Estilos del board (sin cambios)
├── lote-selector.css       ← Estilos del selector (sin cambios)
├── styles-data.css         ← Estilos nuevos: loading, badge, save
│
├── assets/                 ← Imágenes locales (logo, master plan fallback)
│   ├── logo_white.png
│   └── miramar_master_plan_h.png
│
├── apps-script/            ← Código que va en el Apps Script de tu Sheet
│   ├── seed-sheet.gs       ← Corre seedAll() una vez para armar las 27 pestañas
│   └── Code.gs             ← doGet, doPost, helpers, menú custom
│
├── README.md               ← Este archivo
└── SETUP-GUIDE.md          ← Paso a paso completo (45–60 min primera vez)
```

---

## Quick start

1. Lee `SETUP-GUIDE.md`. Hazlo paso a paso, sin saltarte secciones.
2. Si ya tienes el repo y el Sheet, cualquier cambio futuro es solo:
   - **Datos / textos / imágenes** → editas el Sheet, esperas 5 min (o limpias caché)
   - **Estilos / lógica / nuevas secciones** → editas el .jsx, `git push`, esperas 30 seg

---

## Características técnicas relevantes

- **Sin build step.** Babel en navegador. Cualquier `.jsx` se edita y se ve al refrescar.
- **Caché agresivo:** Apps Script cachea 5 min su JSON; el cliente cachea 5 min en localStorage. Reduce lecturas al Sheet de cientos a casi cero.
- **Refresh background:** si el caché está fresco, se muestra inmediato; en paralelo se intenta fetch live y se sobrescribe si llega.
- **Persistencia de coordenadas del lote-selector:** los marcadores se pueden arrastrar en pantalla; las posiciones se guardan en localStorage para ajuste fino sin redeploy. Cuando estás conforme, exportas y pegas al Sheet.
- **Imágenes desde Drive:** pegas un link compartido en la celda y el Apps Script lo convierte al formato `lh3.googleusercontent.com/d/{ID}=w1600` (más confiable que el formato `uc?export=view` que Google está deprecando).
- **CORS-safe doPost:** las respuestas del diagnóstico se mandan como `text/plain` para evitar preflight CORS de Apps Script.

---

## Decisiones de diseño relevantes

- **`STATUS_META` se queda hardcoded** en `lote-selector.jsx` (colores fijos por estado). Son tokens visuales del sistema de diseño, no contenido editable.
- **El mapping de tile.id → Componente** vive en `app.jsx` (`ICON_BY_ID` y `SECTION_BY_ID`). Los componentes React no pueden vivir en Sheets — los datos sí.
- **Lo único que se queda como string HTML en Sheets** es la pestaña `Alysa-Como` (permite `<strong>` inline). Todo lo demás es texto plano.

---

## Próximos pasos (después de tener todo funcionando)

1. **Iconos del tile-grid** — los actuales son los del upload original. Iterar para que cada uno cuente mejor su sección.
2. **Botones de tile** — efectos hover, microinteracciones, transiciones a la sección.
3. **Animaciones de entrada** del dashboard (staggered reveals al cargar).
4. **Modo presentación** — opción que oculta el panel de ajustes y maximiza el contenido para proyección en TV.

---

## Soporte

Esto es construcción interna de Yodesarrollo SAPI. Reportes de bugs o cambios al [README de Aurum Arquitectos] o al chat de Claude donde se construye.
