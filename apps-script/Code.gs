/**
 * Yodesarrollo-Board · Backend
 *
 * doGet  → entrega TODO el JSON del board (cacheado 5 min)
 * doPost → recibe respuestas de Diagnóstico y las apendea a la hoja
 *
 * Despliegue:
 *   1. Run → seedAll() una vez (desde seed-sheet.gs)
 *   2. Implementar → Nueva implementación → Tipo: Aplicación web
 *      · Ejecutar como: yo
 *      · Quién tiene acceso: cualquier persona
 *   3. Copia la URL /exec — esa va en data-loader.jsx
 */

const CACHE_KEY = 'yodesarrollo_board_data_v1';
const CACHE_TTL = 300;  // 5 min

// =============================================================================
// HTTP ENDPOINTS
// =============================================================================
function doGet(e) {
  try {
    const refresh = e && e.parameter && e.parameter.refresh === '1';
    const data = refresh ? rebuildAndCache_() : getCachedOrRebuild_();
    return jsonOut_({ ok: true, data: data, generated_at: new Date().toISOString() });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'save_diagnostico') {
      return jsonOut_(saveDiagnostico_(payload.data));
    }
    return jsonOut_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// CACHE
// =============================================================================
function getCachedOrRebuild_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) { /* fall through */ }
  }
  return rebuildAndCache_();
}

function rebuildAndCache_() {
  const data = getAllData_();
  CacheService.getScriptCache().put(CACHE_KEY, JSON.stringify(data), CACHE_TTL);
  return data;
}

function clearCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
  return 'cache cleared';
}

// =============================================================================
// CONSTRUCTOR DEL JSON
// =============================================================================
function getAllData_() {
  return {
    config:          readKV_('Config'),
    tiles:           readTable_('Tiles'),
    diagnostico:     {
      form: readTable_('Diagnostico-Form'),
    },
    comparativo:     readTable_('Comparativo'),
    alysa: {
      hero:     readKV_('Alysa-Hero', { img_url: 'img' }),
      tiers:    readTable_('Alysa-Tiers'),
      por_que:  readTable_('Alysa-PorQue'),
      como:     readTable_('Alysa-Como'),
    },
    miramar: {
      hero:           readKV_('Miramar-Hero', { master_plan_url: 'img' }),
      etapas:         readTable_('Miramar-Etapas'),
      lotes:          readTable_('Miramar-Lotes'),
      urbanismo:      readTable_('Miramar-Urbanismo'),
      lote_ejemplo:   readTable_('Miramar-LoteEjemplo'),
    },
    calculadora: {
      alysa_brackets: readTable_('Calc-Alysa-Brackets'),
      miramar_config: readKV_('Calc-Miramar-Config'),
    },
    estrategia: {
      hero:  readKV_('Estrategia-Hero'),
      steps: readTable_('Estrategia-Steps'),
    },
    garantias: {
      hero:  readKV_('Garantias-Hero'),
      cards: readTable_('Garantias-Cards'),
    },
    cronograma: {
      hero:            readKV_('Cronograma-Hero'),
      meses:           readTable_('Cronograma-Meses'),
      alysa_hitos:     readTable_('Cronograma-Alysa-Hitos'),
      miramar_hitos:   readTable_('Cronograma-Miramar-Hitos'),
      bullets_alysa:   readTable_('Cronograma-Bullets-Alysa'),
      bullets_miramar: readTable_('Cronograma-Bullets-Miramar'),
      quote:           readKV_('Cronograma-Quote'),
    },
    decision: {
      hero:  readKV_('Decision-Hero'),
      paths: readTable_('Decision-Paths'),
    },
    contacto: {
      hero:    readKV_('Contacto-Hero'),
      asesor:  readKV_('Contacto-Asesor'),
      docs:    readTable_('Contacto-Docs'),
      cta:     readKV_('Contacto-CTA'),
    },
  };
}

// =============================================================================
// READERS GENÉRICOS DE HOJAS
// =============================================================================

/**
 * Lee una hoja con encabezado en fila 1 y devuelve array de objetos.
 * Auto-convierte: TRUE/FALSE → bool, números → Number, URLs de Drive → directas.
 */
function readTable_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];

  const all = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = all[0].map((h) => String(h).trim());
  const out = [];

  for (let r = 1; r < all.length; r++) {
    const row = all[r];
    if (isEmptyRow_(row)) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = normalizeValue_(key, row[c]);
    }
    out.push(obj);
  }
  return out;
}

/**
 * Lee una hoja con dos columnas (key, value) y devuelve un objeto plano.
 * imgKeys: { key: 'img' } indica qué keys son URLs de Drive a convertir.
 */
function readKV_(name, imgKeys) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const all = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const out = {};
  for (let i = 0; i < all.length; i++) {
    const key = String(all[i][0] || '').trim();
    if (!key) continue;
    let val = all[i][1];
    if (imgKeys && imgKeys[key]) {
      val = driveUrl_(val);
    } else {
      val = normalizeValue_(key, val);
    }
    out[key] = val;
  }
  return out;
}

// =============================================================================
// NORMALIZACIÓN DE VALORES
// =============================================================================
function normalizeValue_(key, v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v;

  const s = String(v).trim();

  // URLs de Drive (cualquier columna que termine en _url)
  if (key.endsWith('_url') || key === 'img' || key === 'url') {
    return driveUrl_(s);
  }

  // Booleanos en texto
  if (s === 'TRUE')  return true;
  if (s === 'FALSE') return false;

  // Números
  if (typeof v === 'number') return v;

  return s;
}

function isEmptyRow_(row) {
  for (let i = 0; i < row.length; i++) {
    if (row[i] !== '' && row[i] !== null && row[i] !== undefined) return false;
  }
  return true;
}

// =============================================================================
// DRIVE URL → URL DIRECTA DE IMAGEN
// =============================================================================
/**
 * Convierte cualquier link de Drive a una URL servible como <img src=...>.
 *
 * Acepta:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *   FILE_ID (id pelado)
 *
 * Devuelve: https://lh3.googleusercontent.com/d/FILE_ID=w1600
 * (más confiable que uc?export=view que Google está deprecando)
 */
function driveUrl_(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (!s) return '';

  // Si ya es URL externa no-Drive, déjala
  if (s.startsWith('http') && s.indexOf('drive.google.com') === -1 && s.indexOf('googleusercontent.com') === -1) {
    return s;
  }

  // Si ya está en formato lh3, déjala
  if (s.indexOf('lh3.googleusercontent.com') !== -1) return s;

  // Extrae file id
  let id = '';
  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const m3 = s.match(/^([a-zA-Z0-9_-]{20,})$/);  // id pelado

  if (m1)      id = m1[1];
  else if (m2) id = m2[1];
  else if (m3) id = m3[1];

  if (!id) return s;  // no se pudo extraer, devolver original
  return 'https://lh3.googleusercontent.com/d/' + id + '=w1600';
}

// =============================================================================
// GUARDAR RESPUESTAS DE DIAGNÓSTICO
// =============================================================================
function saveDiagnostico_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Diagnostico-Respuestas');
  if (!sheet) throw new Error('Falta hoja Diagnostico-Respuestas');

  const row = [
    new Date(),
    data.cliente || '',
    data.nombre || '',
    data.ocupacion || '',
    data.como || '',
    data.capital || '',
    data.donde || '',
    data.horizonte || '',
    data.exp || '',
    data.aprendio || '',
    data.motivo || '',
    data.seguro || '',
    data.fuente || 'board-web',
  ];
  sheet.appendRow(row);
  return { ok: true, saved: true, timestamp: row[0].toISOString() };
}

// =============================================================================
// MENÚ PERSONALIZADO EN EL SHEET
// =============================================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Yodesarrollo Board')
    .addItem('Limpiar caché (forzar recarga)', 'clearCache')
    .addItem('Probar JSON en consola', 'previewData')
    .addSeparator()
    .addItem('⚠ Re-sembrar Sheet (BORRA TODO)', 'seedAll')
    .addToUi();
}

function previewData() {
  const data = getAllData_();
  Logger.log(JSON.stringify(data, null, 2));
  SpreadsheetApp.getUi().alert('JSON generado', 'Ver → Logs (Ctrl+Enter) para inspeccionar.', SpreadsheetApp.getUi().ButtonSet.OK);
}
