/**
 * Yodesarrollo-Board · Backend seguro y data-driven (v3.0)
 *
 * Fuente única: el Sheet vinculado. El navegador nunca lee el Sheet directo:
 * entra por esta aplicación web y cada petición valida la sesión del Portero YOD.
 *
 * Despliegue: aplicación web · ejecutar como propietario · acceso: cualquiera.
 */

const CACHE_KEY = 'yodesarrollo_board_data_v3';
const CACHE_TTL = 300;
const PORTERO_EXEC = 'https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';
const AUTH_TTL_OK = 600;
const AUTH_TTL_BAD = 60;

function doGet(e) {
  try {
    const k = (e && e.parameter && e.parameter.k) || '';
    if (!credencialValida_(k)) return jsonOut_({ ok: false, error: 'liga', version: '3.0.0' });
    const refresh = !!(e && e.parameter && e.parameter.refresh === '1');
    const data = refresh ? rebuildAndCache_() : getCachedOrRebuild_();
    return jsonOut_({ ok: true, data: data, generated_at: new Date().toISOString(), version: '3.0.0' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err), version: '3.0.0' });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!credencialValida_(payload.k || '')) return jsonOut_({ ok: false, error: 'liga', version: '3.0.0' });
    if (payload.action === 'save_diagnostico') return jsonOut_(saveDiagnostico_(payload.data || {}));
    return jsonOut_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function credencialValida_(k) {
  k = String(k || '').trim();
  if (k.length < 4) return false;
  const cache = CacheService.getScriptCache();
  const ck = 'auth_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, k)).slice(0, 24);
  const hit = cache.get(ck);
  if (hit) return hit === '1';
  let ok = false;
  try {
    const response = UrlFetchApp.fetch(
      PORTERO_EXEC + '?recurso=canje&board=IV&t=' + encodeURIComponent(k),
      { muteHttpExceptions: true, followRedirects: true }
    );
    const body = JSON.parse(response.getContentText());
    ok = !!(body && body.ok);
  } catch (err) {
    ok = false;
  }
  cache.put(ck, ok ? '1' : '0', ok ? AUTH_TTL_OK : AUTH_TTL_BAD);
  return ok;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getCachedOrRebuild_() {
  const hit = CacheService.getScriptCache().get(CACHE_KEY);
  if (hit) {
    try { return JSON.parse(hit); } catch (err) { /* reconstruir */ }
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

function getAllData_() {
  const lotes = readTable_('Lotes');
  const proyectos = enrichProjects_(readTable_('Proyectos'), lotes);
  const sections = buildSections_();
  const legacy = buildLegacyViews_(proyectos);
  return Object.assign({
    config: readKV_('Config'),
    tiles: readTable_('Tiles'),
    diagnostico: { form: readTable_('Diagnostico-Form') },
    comparativo: readTable_('Comparativo'),
    proyectos: proyectos,
    inversionistas: readTable_('Inversionistas'),
    movimientos: readTable_('Movimientos'),
    cronograma: buildCronograma_(),
    generated_at: new Date().toISOString(),
  }, sections, legacy);
}

function enrichProjects_(projects, allLots) {
  return projects.map(function (p) {
    p.nivel = String(p.nivel || '').trim();
    p.por_que = splitList_(p.por_que);
    p.como = splitList_(p.como);
    p.lotes = allLots.filter(function (lot) { return String(lot.proyecto_id) === String(p.id); });
    if (p.modelo === 'coinversion') p.tiers = buildTiers_(p);
    if (p.modelo === 'plusvalia') {
      p.etapas = buildStages_(p);
      const entry = number_(p.pv_fund2 || p.pv_preventa1);
      const exit = number_(p.pv_mercado24 || p.pv_venta);
      const plazo = number_(p.pv_plazo) || 24;
      const totalPct = entry ? ((exit / entry) - 1) * 100 : 0;
      const annualPct = entry && plazo ? (Math.pow(exit / entry, 12 / plazo) - 1) * 100 : 0;
      p.plusvalia = {
        plusvalia_24m_pct: round_(totalPct, 1),
        anualizado_pct: round_(annualPct, 1),
      };
      p.pv_lista = number_(p.pv_venta);
      p.lote_ejemplo = buildLotExample_(p);
    }
    return p;
  }).sort(function (a, b) { return number_(a.orden) - number_(b.orden); });
}

function buildTiers_(p) {
  const count = Math.max(1, number_(p.ci_num_tramos) || 1);
  const base = number_(p.ci_ticket_min);
  const step = number_(p.ci_paso);
  const baseRate = number_(p.ci_tasa_base);
  const rateStep = number_(p.ci_tasa_incr);
  const plazo = number_(p.ci_plazo) || 8;
  const star = number_(p.ci_tramo_estrella);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const capital = base + (step * i);
    const rate = baseRate + (rateStep * i);
    const retorno6 = capital * rate / 100 * 6 / 12;
    const retornoPlazo = capital * rate / 100 * plazo / 12;
    rows.push({
      order: i + 1,
      capital: capital,
      rate: round_(rate, 2),
      retorno6: Math.round(retorno6),
      retorno8: Math.round(retornoPlazo),
      total: Math.round(capital + retornoPlazo),
      star: star === i + 1,
    });
  }
  return rows;
}

function buildStages_(p) {
  const defs = [
    ['fundador', 'Entrada hoy', p.pv_fund2],
    ['preventa-i', 'Preventa I', p.pv_preventa1],
    ['preventa-ii', 'Preventa II', p.pv_preventa2],
    ['venta', 'Precio de venta', p.pv_venta],
    ['mercado', 'Mercado objetivo', p.pv_mercado24],
  ];
  const rows = [];
  defs.forEach(function (d) {
    const price = number_(d[2]);
    if (!price) return;
    rows.push({ id: d[0], label: d[1], price_m2: price, order: rows.length + 1, current: rows.length === 0, done: false });
  });
  return rows;
}

function buildLotExample_(p) {
  const m2 = number_(p.pv_lote_ejemplo_m2);
  const entry = number_(p.pv_fund2 || p.pv_preventa1);
  const exit = number_(p.pv_venta || p.pv_mercado24);
  if (!m2 || !entry || !exit) return { titulo: '', filas: [] };
  const initial = Math.round(m2 * entry);
  const finalValue = Math.round(m2 * exit);
  return {
    titulo: 'Lote ejemplo · ' + m2 + ' m²',
    filas: [
      { label: 'Superficie', value: m2 + ' m²' },
      { label: 'Entrada hoy', value: money_(initial) },
      { label: 'Valor de venta', value: money_(finalValue) },
      { label: 'Plusvalía bruta', value: money_(finalValue - initial), highlight: true },
    ],
  };
}

function buildSections_() {
  const rows = readTable_('Secciones');
  const out = {};
  const grouped = {};
  rows.forEach(function (row) {
    const section = String(row.seccion || '').trim();
    const key = String(row.clave || '').trim();
    if (!section || !key) return;
    if (!out[section]) out[section] = {};
    const parts = key.split('.');
    const prefixMap = { card: 'cards', path: 'paths', doc: 'docs', step: 'steps' };
    if (prefixMap[parts[0]] && parts.length >= 3) {
      const collection = prefixMap[parts[0]];
      const bucketKey = section + ':' + collection;
      if (!grouped[bucketKey]) grouped[bucketKey] = {};
      const id = parts[1];
      if (!grouped[bucketKey][id]) grouped[bucketKey][id] = {};
      grouped[bucketKey][id][parts.slice(2).join('_')] = row.valor;
      return;
    }
    setNested_(out[section], parts, row.valor);
  });
  Object.keys(grouped).forEach(function (bucketKey) {
    const pair = bucketKey.split(':');
    const section = pair[0], collection = pair[1];
    out[section][collection] = Object.keys(grouped[bucketKey]).map(function (id) {
      return grouped[bucketKey][id];
    }).sort(function (a, b) { return number_(a.order) - number_(b.order); });
  });
  return out;
}

function buildCronograma_() {
  const rows = readTable_('Cronograma');
  const out = {};
  const groups = {};
  const map = {
    mes: 'meses',
    hito_alysa: 'alysa_hitos',
    hito_miramar: 'miramar_hitos',
    hito_dunas: 'dunas_hitos',
    bullet_alysa: 'bullets_alysa',
    bullet_miramar: 'bullets_miramar',
    bullet_dunas: 'bullets_dunas',
  };
  rows.forEach(function (row) {
    const key = String(row.clave || '').trim();
    if (!key) return;
    if (key === 'quote') { out.quote = { quote: row.valor }; return; }
    const parts = key.split('.');
    if (map[parts[0]] && parts.length >= 3) {
      const name = map[parts[0]], id = parts[1];
      if (!groups[name]) groups[name] = {};
      if (!groups[name][id]) groups[name][id] = {};
      groups[name][id][parts.slice(2).join('_')] = row.valor;
      groups[name][id][parts[0] === 'mes' || parts[0].indexOf('hito_') === 0 ? 'mes' : 'order'] = number_(id);
      return;
    }
    setNested_(out, parts, row.valor);
  });
  Object.keys(groups).forEach(function (name) {
    out[name] = Object.keys(groups[name]).map(function (id) { return groups[name][id]; })
      .sort(function (a, b) { return number_(a.mes || a.order) - number_(b.mes || b.order); });
  });
  return out;
}

function buildLegacyViews_(projects) {
  const alysa = projects.filter(function (p) { return p.id === 'casa-alysa'; })[0] || {};
  const miramar = projects.filter(function (p) { return p.id === 'real-miramar'; })[0] || {};
  const firstCoinv = projects.filter(function (p) { return p.activo !== false && p.modelo === 'coinversion'; })[0] || alysa;
  const firstPlus = projects.filter(function (p) { return p.activo !== false && p.modelo === 'plusvalia'; })[0] || miramar;
  return {
    alysa: {
      hero: legacyHero_(alysa),
      tiers: alysa.tiers || [],
      por_que: (alysa.por_que || []).map(parseStrongBullet_),
      como: (alysa.como || []).map(function (html, i) { return { order: i + 1, html: html }; }),
    },
    miramar: {
      hero: Object.assign(legacyHero_(miramar), {
        master_plan_url: miramar.img_plano_url || miramar.img_url || '',
        commercial_price_m2: number_(miramar.pv_venta),
        commercial_label: 'Venta directa',
      }),
      lotes: miramar.lotes || [],
      etapas: miramar.etapas || [],
      urbanismo: (miramar.por_que || []).map(function (text, i) { return { order: i + 1, text: stripHtml_(text) }; }),
      lote_ejemplo: legacyLotExample_(miramar.lote_ejemplo),
    },
    calculadora: { alysa_brackets: [], miramar_config: {} },
    estrategia: buildStrategy_(firstCoinv, firstPlus),
  };
}

function legacyHero_(p) {
  return {
    kicker: p.kicker || '',
    display: p.hero_display || p.nombre || '',
    lead: p.hero_lead || '',
    ubicacion: p.ubicacion || '',
    img_url: p.img_hero_url || p.img_url || '',
    stat_1_value: p.stat_1_value || '', stat_1_label: p.stat_1_label || '',
    stat_2_value: p.stat_2_value || '', stat_2_label: p.stat_2_label || '',
    stat_3_value: p.stat_3_value || '', stat_3_label: p.stat_3_label || '',
    stat_4_value: p.stat_4_value || '', stat_4_label: p.stat_4_label || '',
  };
}

function legacyLotExample_(example) {
  const rows = (example && example.filas) || [];
  const out = [{ key: 'titulo', label: (example && example.titulo) || 'Caso fundador' }];
  rows.forEach(function (row, i) { out.push({ key: 'row_' + i, label: row.label, value: row.value, highlight: !!row.highlight }); });
  return out;
}

function buildStrategy_(coinv, plus) {
  const plazoA = number_(coinv.ci_plazo) || 8;
  const plazoB = number_(plus.pv_plazo) || 24;
  return {
    hero: {
      kicker: 'Estrategia combinada',
      display_line1: (coinv.nombre || 'Coinversión') + ' primero.',
      display_line2: (plus.nombre || 'Plusvalía') + ' después.',
      lead: 'Una ruta para cobrar rendimiento y después mover el capital a plusvalía inmobiliaria.',
      stat_1_value: coinv.stat_2_value || '', stat_1_label: 'Rendimiento inicial',
      stat_2_value: plazoA + 'm', stat_2_label: 'Primer tramo',
      stat_3_value: plus.stat_2_value || '', stat_3_label: 'Plusvalía objetivo',
      stat_4_value: plazoB + 'm', stat_4_label: 'Horizonte total',
    },
    steps: [
      { order: 1, mes: 'Mes 0', titulo: 'Entrar a ' + (coinv.nombre || 'coinversión'), note: 'Capital respaldado por activo tangible.' },
      { order: 2, mes: 'Mes ' + plazoA, titulo: 'Cobrar rendimiento', note: 'Recuperar capital más rendimiento pactado.' },
      { order: 3, mes: 'Mes ' + plazoB, titulo: 'Consolidar plusvalía', note: 'Salida estimada del vehículo ' + (plus.nombre || 'de plusvalía') + '.' },
    ],
  };
}

function readTable_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const all = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = all[0].map(function (h) { return String(h).trim(); });
  const out = [];
  for (let r = 1; r < all.length; r++) {
    if (isEmptyRow_(all[r])) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) if (headers[c]) obj[headers[c]] = normalizeValue_(headers[c], all[r][c]);
    out.push(obj);
  }
  return out;
}

function readKV_(name) {
  const rows = readTable_(name), out = {};
  rows.forEach(function (row) {
    const key = String(row.key || '').trim();
    if (key) out[key] = normalizeValue_(key, row.value);
  });
  return out;
}

function setNested_(target, parts, value) {
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}

function normalizeValue_(key, value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  const s = String(value).trim();
  if (s === 'TRUE') return true;
  if (s === 'FALSE') return false;
  if (key.endsWith('_url') || key === 'url' || key === 'img') return driveUrl_(s);
  return s;
}

function driveUrl_(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (!s || (s.indexOf('drive.google.com') === -1 && s.indexOf('googleusercontent.com') === -1)) return s;
  if (s.indexOf('lh3.googleusercontent.com') !== -1) return s;
  const match = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? 'https://lh3.googleusercontent.com/d/' + match[1] + '=w1600' : s;
}

function splitList_(value) {
  return String(value || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
}

function parseStrongBullet_(html, index) {
  const match = String(html || '').match(/^<strong>(.*?)<\/strong>\s*[—-]?\s*(.*)$/i);
  return { order: index + 1, strong: match ? match[1] : '', text: match ? match[2] : stripHtml_(html) };
}

function stripHtml_(html) { return String(html || '').replace(/<[^>]*>/g, ''); }
function number_(value) { const n = Number(value); return isFinite(n) ? n : 0; }
function round_(value, decimals) { const f = Math.pow(10, decimals || 0); return Math.round(value * f) / f; }
function money_(value) { return '$' + Math.round(number_(value)).toLocaleString('en-US') + ' MXN'; }
function isEmptyRow_(row) { return row.every(function (value) { return value === '' || value === null || value === undefined; }); }

function saveDiagnostico_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Diagnostico-Respuestas');
  if (!sheet) throw new Error('Falta hoja Diagnostico-Respuestas');
  const row = [
    new Date(), data.cliente || '', data.nombre || '', data.ocupacion || '', data.como || '',
    data.capital || '', data.donde || '', data.horizonte || '', data.exp || '', data.aprendio || '',
    data.motivo || '', data.seguro || '', data.fuente || 'board-web',
  ];
  sheet.appendRow(row);
  return { ok: true, saved: true, timestamp: row[0].toISOString() };
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Yodesarrollo Board')
    .addItem('Limpiar caché (forzar recarga)', 'clearCache')
    .addItem('Probar JSON en consola', 'previewData')
    .addToUi();
}

function previewData() {
  Logger.log(JSON.stringify(getAllData_(), null, 2));
}
