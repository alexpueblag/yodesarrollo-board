/**
 * Yodesarrollo-Board · Seed
 *
 * Ejecuta UNA SOLA VEZ para crear la estructura completa del Sheet.
 * Después de seedAll(), el dueño edita las celdas directamente.
 *
 * Cómo usar:
 *   1. Crea un Sheet vacío llamado "Yodesarrollo-Board"
 *   2. Extensiones → Apps Script
 *   3. Pega ESTE archivo y Code.gs
 *   4. Run → seedAll()  (autoriza permisos cuando pida)
 *   5. Vuelve al Sheet → verás 27 pestañas armadas
 */

// =============================================================================
// MAIN
// =============================================================================
function seedAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Hoja default que vino con el Sheet vacío — la renombramos a Config
  const defaultSheet = ss.getSheets()[0];
  defaultSheet.setName('_temp_default');

  SHEETS.forEach((def) => {
    seedSheet_(ss, def);
  });

  // Borra la hoja default si quedó vacía
  if (ss.getSheetByName('_temp_default')) {
    ss.deleteSheet(ss.getSheetByName('_temp_default'));
  }

  // Reordena: Config primero
  const cfg = ss.getSheetByName('Config');
  if (cfg) ss.setActiveSheet(cfg);

  SpreadsheetApp.getUi().alert(
    '✓ Seed completo',
    'Se crearon ' + SHEETS.length + ' pestañas con datos semilla.\n\n' +
    'Ahora edita libremente cada pestaña. El board jala los cambios al recargar.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function seedSheet_(ss, def) {
  let sheet = ss.getSheetByName(def.name);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(def.name);
  }

  // Escribe headers
  sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);

  // Datos semilla
  if (def.rows && def.rows.length) {
    sheet.getRange(2, 1, def.rows.length, def.headers.length).setValues(def.rows);
  }

  // Formato headers
  const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1f2933');
  headerRange.setFontColor('#f5f1ea');
  headerRange.setHorizontalAlignment('left');
  sheet.setFrozenRows(1);

  // Auto-resize columnas
  for (let i = 1; i <= def.headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Si tiene anchos específicos
  if (def.colWidths) {
    def.colWidths.forEach((w, i) => {
      if (w) sheet.setColumnWidth(i + 1, w);
    });
  }
}

// =============================================================================
// DEFINICIÓN DE LAS 27 HOJAS
// =============================================================================
const SHEETS = [

  // -------------------------- 1. CONFIG GLOBAL --------------------------
  {
    name: 'Config',
    headers: ['key', 'value', 'nota'],
    colWidths: [220, 480, 280],
    rows: [
      ['brand_name',              'YODESARROLLO · INVERSIÓN PATRIMONIAL', 'Texto del header principal'],
      ['brand_sub_default',       'Edición fundadora · 2026',             'Subtítulo cuando no hay cliente'],
      ['folio',                   'YDR-2026-001',                          'Folio en footer'],
      ['logo_url',                '',                                      'Link compartido de Drive al logo blanco. Vacío = usa local'],
      ['default_client',          '',                                      'Nombre del cliente default (vacío para reunión nueva)'],
      ['default_aesthetic',       'carplay',                               'carplay | editorial | mono'],
      ['show_clock',              'TRUE',                                  'TRUE = muestra reloj en header'],
      ['header_stat_1_label',     'Alysa',                                 ''],
      ['header_stat_1_value',     '$1.0M',                                 ''],
      ['header_stat_2_label',     'Miramar',                               ''],
      ['header_stat_2_value',     '4/6',                                   ''],
      ['header_stat_3_label',     'Próx.',                                 ''],
      ['header_stat_3_value',     '+17%',                                  ''],
      ['foot_left',               'CARPETA DE INVERSIÓN · FOL · YDR-2026-001 · Documento confidencial', 'Texto del footer izquierdo'],
      ['foot_cta',                'Empezar por el diagnóstico',           ''],
    ],
  },

  // -------------------------- 2. TILES DEL BOARD --------------------------
  {
    name: 'Tiles',
    headers: ['order', 'id', 'label', 'kicker', 'color', 'accent', 'act', 'badge', 'enabled'],
    colWidths: [60, 130, 130, 220, 90, 90, 60, 160, 80],
    rows: [
      [1,  'diagnostico',  'Diagnóstico',  'Acto I · Conversación',    '#2d4c55', '#7fb8c8', 'I',   'Acto I',          'TRUE'],
      [2,  'comparativo',  'Comparativo',  'Acto II · Rendimientos',   '#2a3a52', '#92b3d8', 'II',  'Acto II',         'TRUE'],
      [3,  'casa-alysa',   'Casa Alysa',   'Yield · 8 meses',          '#785025', '#e0b274', 'III', '$1M libre · 80%', 'TRUE'],
      [4,  'real-miramar', 'Real Miramar', 'Plusvalía · 24 meses',     '#3f5238', '#a4be90', 'III', '4/6 lotes',       'TRUE'],
      [5,  'calculadora',  'Calculadora',  'Simulador',                '#443060', '#b094c7', 'III', '',                'TRUE'],
      [6,  'estrategia',   'Estrategia',   'Doble plazo',              '#743442', '#cd9aa5', 'III', 'Para $1M+',       'TRUE'],
      [7,  'garantias',    'Garantías',    'Marco legal',              '#1f3340', '#8aaac2', 'III', '5 garantías',     'TRUE'],
      [8,  'cronograma',   'Cronograma',   'Hitos · ventana',          '#3a3c40', '#b5b3a9', 'III', '+17% próx.',      'TRUE'],
      [9,  'decision',     'Decisión',     'Acto IV · Cierre',         '#5e2530', '#d68493', 'IV',  'Acto IV',         'TRUE'],
      [10, 'contacto',     'Contacto',     'Siguiente paso',           '#292828', '#d4be8a', 'IV',  '',                'TRUE'],
    ],
  },

  // -------------------------- 3. DIAGNÓSTICO · FORM --------------------------
  {
    name: 'Diagnostico-Form',
    headers: ['order', 'card_num', 'card_legend', 'card_time', 'field_key', 'field_label', 'field_type', 'field_options', 'rows'],
    colWidths: [60, 80, 220, 90, 110, 280, 110, 380, 60],
    rows: [
      [1, 1, 'Quiénes somos hoy',     '5 min',  'nombre',    'Nombre completo',                      'text',     '', ''],
      [2, 1, 'Quiénes somos hoy',     '5 min',  'ocupacion', 'Ocupación / actividad principal',      'text',     '', ''],
      [3, 1, 'Quiénes somos hoy',     '5 min',  'como',      '¿Cómo llegamos a esta reunión?',       'text',     '', ''],
      [4, 2, 'Cómo manejas tu capital','10 min','capital',   'Capital líquido disponible',           'text',     '', ''],
      [5, 2, 'Cómo manejas tu capital','10 min','donde',     '¿Dónde está hoy?',                     'chips',    'Banco|CETES|Pagaré|Acciones|Bienes raíces|Negocio propio', ''],
      [6, 2, 'Cómo manejas tu capital','10 min','horizonte', 'Horizonte de inversión',               'chips',    '< 1 año|1–3 años|3+ años|Mixto', ''],
      [7, 3, 'Experiencia previa',    '5 min',  'exp',       '¿Has invertido en bienes raíces?',     'chips',    'Nunca|Una vez|Varias veces|Principal vehículo', ''],
      [8, 3, 'Experiencia previa',    '5 min',  'aprendio',  '¿Qué aprendiste?',                     'textarea', '', '2'],
      [9, 4, 'Qué buscas realmente',  '5 min',  'motivo',    'Motivación dominante',                 'chips',    'Preservar|Multiplicar|Pertenecer|Heredar', ''],
      [10,4, 'Qué buscas realmente',  '5 min',  'seguro',    '¿Qué necesitarías ver para sentirte 100% seguro?', 'textarea', '', '2'],
    ],
  },

  // -------------------------- 4. DIAGNÓSTICO · RESPUESTAS (append-only) --------------------------
  {
    name: 'Diagnostico-Respuestas',
    headers: ['timestamp', 'cliente', 'nombre', 'ocupacion', 'como', 'capital', 'donde', 'horizonte', 'exp', 'aprendio', 'motivo', 'seguro', 'fuente'],
    colWidths: [160, 160, 160, 200, 200, 140, 140, 140, 160, 280, 140, 280, 120],
    rows: [],  // vacía — se llena por doPost
  },

  // -------------------------- 5. COMPARATIVO --------------------------
  {
    name: 'Comparativo',
    headers: ['order', 'instrumento', 'bruto', 'inflacion', 'isr', 'neto', 'nota', 'star', 'link'],
    colWidths: [60, 200, 100, 110, 100, 130, 320, 70, 140],
    rows: [
      [1, 'Cuenta bancaria',     '1–3%',   '−4.5%',  '—',        'Negativo',     'Pierdes poder adquisitivo.',         'FALSE', ''],
      [2, 'CETES',               '9–10%',  '−4.5%',  '−1.5%',    '~3–4%',        'Apenas vence inflación.',            'FALSE', ''],
      [3, 'Pagaré bancario',     '8–9%',   '−4.5%',  '−1.5%',    '~2–3%',        'Liquidez con costo real.',           'FALSE', ''],
      [4, 'Renta de inmueble',   '5–7%',   '−4.5%',  'Variable', '~1–3%',        'Capital ocioso, mucha operación.',   'FALSE', ''],
      [5, 'Casa Alysa $200K',    '20%',    '−4.5%',  'Variable', '~16% real',    'Yield escriturado, 8 meses.',        'TRUE',  'casa-alysa'],
      [6, 'Casa Alysa $1M',      '25%',    '−4.5%',  'Variable', '~20% real',    'Tasa preferente por volumen.',       'TRUE',  'casa-alysa'],
      [7, 'Lote Real Miramar',   '26%',    '−4.5%',  'Variable', '~25% real',    'Plusvalía progresiva 24m.',          'TRUE',  'real-miramar'],
    ],
  },

  // -------------------------- 6. CASA ALYSA · HERO --------------------------
  {
    name: 'Alysa-Hero',
    headers: ['key', 'value'],
    colWidths: [200, 580],
    rows: [
      ['kicker',           'Vehículo I · Yield 8 meses'],
      ['display',          'Casa Alysa'],
      ['lead',             'Coinversión escriturada en residencia premium frente al lago, Altozano · Hermosillo. Activo terminado al 80%.'],
      ['stat_1_value',     '$200K'],
      ['stat_1_label',     'Ticket mínimo'],
      ['stat_2_value',     '20–25%'],
      ['stat_2_label',     'Tasa anual bruta'],
      ['stat_3_value',     '8m'],
      ['stat_3_label',     'Plazo a salida'],
      ['stat_4_value',     '80%'],
      ['stat_4_label',     'Avance de obra'],
      ['img_url',          ''],   // ← Link Drive del render Casa Alysa
      ['img_caption',      'Render Casa Alysa — frente al lago Altozano'],
      ['ubicacion',        'Altozano · Hermosillo'],
      ['valor_proyectado', '5855850'],
      ['capital_faltante', '1000000'],
    ],
  },

  // -------------------------- 7. CASA ALYSA · TIERS --------------------------
  {
    name: 'Alysa-Tiers',
    headers: ['order', 'capital', 'rate', 'retorno6', 'retorno8', 'total', 'star'],
    colWidths: [60, 110, 80, 110, 110, 110, 70],
    rows: [
      [1, 200000,  20.00, 20000,  26667,  226667,  'FALSE'],
      [2, 400000,  21.25, 42500,  56667,  456667,  'FALSE'],
      [3, 600000,  22.50, 67500,  90000,  690000,  'FALSE'],
      [4, 800000,  23.75, 95000,  126667, 926667,  'FALSE'],
      [5, 1000000, 25.00, 125000, 166667, 1166667, 'TRUE'],
    ],
  },

  // -------------------------- 8. CASA ALYSA · "POR QUÉ" --------------------------
  {
    name: 'Alysa-PorQue',
    headers: ['order', 'strong', 'text'],
    colWidths: [60, 220, 520],
    rows: [
      [1, 'Ubicación escasa',                  'frente al lago en Altozano, segmento premium de Hermosillo.'],
      [2, 'Recámara principal en planta baja', 'amplía el universo de compradores.'],
      [3, 'Diseño con identidad',              'compite por valor, no por precio.'],
      [4, 'Avance 80%',                        'riesgo de ejecución mitigado.'],
    ],
  },

  // -------------------------- 9. CASA ALYSA · "CÓMO ENTRAS" --------------------------
  {
    name: 'Alysa-Como',
    headers: ['order', 'html'],
    colWidths: [60, 720],
    rows: [
      [1, 'Copropiedad pro-indiviso <strong>escriturada ante notario</strong>.'],
      [2, 'Tasa preferente con respaldo del activo físico.'],
      [3, 'Cuenta exclusiva del proyecto · reportes trimestrales.'],
      [4, 'Capital faltante: <strong>$1M</strong> sobre valor proyectado de <strong>$5,855,850</strong>.'],
    ],
  },

  // -------------------------- 10. REAL MIRAMAR · HERO --------------------------
  {
    name: 'Miramar-Hero',
    headers: ['key', 'value'],
    colWidths: [200, 580],
    rows: [
      ['kicker',          'Vehículo II · Plusvalía 24m'],
      ['display',         'Real Miramar'],
      ['stat_1_value',    '$3,750'],
      ['stat_1_label',    '$/m² · F.II hoy'],
      ['stat_2_value',    '+27%'],
      ['stat_2_label',    'F.II → Venta'],
      ['stat_3_value',    '~24m'],
      ['stat_3_label',    'Horizonte'],
      ['stat_4_value',          '800m'],
      ['stat_4_label',          'Al malecón'],
      ['master_plan_url',       ''],     // ← Link Drive al plano maestro. Vacío = usa assets/miramar_master_plan_h.png
      ['commercial_price_m2',   5250],   // Precio fijo $/m² para lotes COMERCIAL
      ['commercial_label',      'Venta directa · Mayo 2026'],
    ],
  },

  // -------------------------- 11. REAL MIRAMAR · ETAPAS --------------------------
  {
    name: 'Miramar-Etapas',
    headers: ['order', 'id', 'label', 'price_m2', 'pct_obra', 'status', 'current', 'done'],
    colWidths: [60, 100, 140, 110, 90, 220, 80, 70],
    rows: [
      [1, 'fund-i',  'Fundadores I',  3258, 55,  'Plan urbano',           'FALSE', 'TRUE'],
      [2, 'fund-ii', 'Fundadores II', 3750, 60,  'ETAPA ACTUAL',          'TRUE',  'FALSE'],
      [3, 'prev-i',  'Preventa I',    4075, 70,  'Licencia ambiental',    'FALSE', 'FALSE'],
      [4, 'prev-ii', 'Preventa II',   4325, 85,  'Servicios aprobados',   'FALSE', 'FALSE'],
      [5, 'venta',   'Precio Venta',  4750, 100, 'Inicio urbanización',   'FALSE', 'FALSE'],
    ],
  },

  // -------------------------- 12. REAL MIRAMAR · LOTES --------------------------
  {
    name: 'Miramar-Lotes',
    headers: ['n', 'm2', 'uso', 'x', 'y', 'status'],
    colWidths: [60, 110, 130, 70, 70, 110],
    rows: [
      [1,  1529.041, 'COMERCIAL',    93.5, 33.8, 'commercial'],
      [47, 346.799,  'COMERCIAL',    91.4, 83.6, 'commercial'],
      [2,  180,      'HABITACIONAL', 82.4, 51.9, 'available'],
      [3,  208,      'HABITACIONAL', 77.8, 51.1, 'available'],
      [4,  178,      'HABITACIONAL', 80.2, 36.0, 'available'],
      [5,  223,      'HABITACIONAL', 79.6, 23.3, 'available'],
      [6,  318,      'HABITACIONAL', 74.8, 13.3, 'available'],
      [7,  321,      'HABITACIONAL', 68.6, 14.1, 'available'],
      [8,  223,      'HABITACIONAL', 62.1, 24.3, 'available'],
      [9,  178,      'HABITACIONAL', 61.8, 35.4, 'available'],
      [10, 208,      'HABITACIONAL', 65.1, 50.3, 'available'],
      [11, 180,      'HABITACIONAL', 59.9, 51.1, 'available'],
      [12, 180,      'HABITACIONAL', 55.2, 50.9, 'available'],
      [13, 208,      'HABITACIONAL', 50.9, 50.6, 'reserved'],
      [14, 178,      'HABITACIONAL', 53.2, 36.0, 'available'],
      [15, 223,      'HABITACIONAL', 53.4, 24.3, 'available'],
      [16, 324,      'HABITACIONAL', 47.8, 14.1, 'available'],
      [17, 327,      'HABITACIONAL', 40.8, 13.5, 'available'],
      [18, 223,      'HABITACIONAL', 35.7, 24.1, 'available'],
      [19, 178,      'HABITACIONAL', 35.5, 35.4, 'available'],
      [20, 180,      'HABITACIONAL', 28.7, 50.3, 'available'],
      [21, 208,      'HABITACIONAL', 24.5, 50.0, 'available'],
      [22, 178,      'HABITACIONAL', 27.2, 35.7, 'available'],
      [23, 223,      'HABITACIONAL', 26.1, 24.9, 'available'],
      [24, 330,      'HABITACIONAL', 20.5, 15.2, 'available'],
      [25, 328,      'HABITACIONAL', 13.8, 14.3, 'available'],
      [26, 203,      'HABITACIONAL',  9.9, 24.1, 'available'],
      [27, 181,      'HABITACIONAL',  9.4, 38.1, 'available'],
      [28, 202,      'HABITACIONAL', 10.4, 49.5, 'available'],
      [29, 200,      'HABITACIONAL', 11.1, 60.9, 'available'],
      [30, 411,      'HABITACIONAL', 11.3, 77.6, 'available'],
      [31, 225,      'HABITACIONAL', 16.9, 84.4, 'available'],
      [32, 180,      'HABITACIONAL', 21.3, 85.2, 'available'],
      [33, 180,      'HABITACIONAL', 25.9, 84.9, 'available'],
      [34, 180,      'HABITACIONAL', 30.1, 85.2, 'available'],
      [35, 180,      'HABITACIONAL', 34.8, 85.5, 'reserved'],
      [36, 180,      'HABITACIONAL', 38.9, 85.2, 'available'],
      [37, 180,      'HABITACIONAL', 43.0, 86.0, 'available'],
      [38, 180,      'HABITACIONAL', 47.5, 85.5, 'available'],
      [39, 180,      'HABITACIONAL', 52.1, 85.8, 'available'],
      [40, 180,      'HABITACIONAL', 56.1, 85.5, 'available'],
      [41, 180,      'HABITACIONAL', 60.7, 85.5, 'available'],
      [42, 180,      'HABITACIONAL', 64.7, 85.2, 'available'],
      [43, 180,      'HABITACIONAL', 69.1, 85.5, 'available'],
      [44, 180,      'HABITACIONAL', 73.8, 85.2, 'available'],
      [45, 180,      'HABITACIONAL', 78.1, 85.2, 'available'],
      [46, 180,      'HABITACIONAL', 82.3, 84.7, 'available'],
    ],
  },

  // -------------------------- 13. REAL MIRAMAR · URBANISMO --------------------------
  {
    name: 'Miramar-Urbanismo',
    headers: ['order', 'text'],
    colWidths: [60, 720],
    rows: [
      [1, 'Diseño orientado al peatón · andadores ecológicos.'],
      [2, 'Vialidad central de concreto · adopasto lateral.'],
      [3, 'Rotondas amenizadas · landscape autóctono.'],
      [4, 'Casa Club · CCTV y seguridad privada.'],
      [5, 'Manejo pluvial ecológico.'],
    ],
  },

  // -------------------------- 14. REAL MIRAMAR · LOTE EJEMPLO --------------------------
  {
    name: 'Miramar-LoteEjemplo',
    headers: ['key', 'label', 'value', 'highlight'],
    colWidths: [180, 220, 200, 80],
    rows: [
      ['titulo',            'Lote 180 m² Fundador II',    '',                   'FALSE'],
      ['precio_f2',         'Precio F.II',                 '$675,000',          'FALSE'],
      ['anticipo_35',       'Anticipo 35%',                '$236,250',          'FALSE'],
      ['valor_24m',         'Valor estimado en 24m',       '$855,000',          'FALSE'],
      ['plusvalia_bruta',   'Plusvalía bruta',             '+$180,000 · +27%',  'TRUE'],
    ],
  },

  // -------------------------- 15. CALCULADORA · BRACKETS ALYSA --------------------------
  {
    name: 'Calc-Alysa-Brackets',
    headers: ['min_capital', 'rate', 'nota'],
    colWidths: [140, 80, 280],
    rows: [
      [0,       20.00, 'Tasa base'],
      [400000,  21.25, ''],
      [600000,  22.50, ''],
      [800000,  23.75, ''],
      [1000000, 25.00, 'Tasa preferente máxima'],
    ],
  },

  // -------------------------- 16. CALCULADORA · CONFIG MIRAMAR --------------------------
  {
    name: 'Calc-Miramar-Config',
    headers: ['key', 'value', 'nota'],
    colWidths: [220, 100, 320],
    rows: [
      ['plusvalia_24m_pct',    53,  'Plusvalía total proyectada 24 meses'],
      ['anualizado_pct',       26,  'Equivalente anualizado para mostrar en UI'],
      ['min_capital',          200000, 'Mínimo del slider en la calculadora'],
      ['max_capital',          3000000, 'Máximo del slider'],
      ['step',                 50000, 'Incremento del slider'],
    ],
  },

  // -------------------------- 17. ESTRATEGIA · HERO --------------------------
  {
    name: 'Estrategia-Hero',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',          'Diversificación · doble plazo'],
      ['display_line1',   'Cuando los dos'],
      ['display_line2',   'trabajan juntos.'],
      ['lead',            'Para inversionistas con $1M+ líquidos: retorno rápido en Alysa + patrimonio medio plazo en Miramar. Cuando Alysa cierra, ese capital se reinvierte en lotes fundadores II.'],
      ['stat_1_value',    '$1.0M'],
      ['stat_1_label',    'Capital total'],
      ['stat_2_value',    '25%'],
      ['stat_2_label',    'Tasa anual Alysa'],
      ['stat_3_value',    '+53%'],
      ['stat_3_label',    'Plusvalía Miramar 24m'],
      ['stat_4_value',    '~78%'],
      ['stat_4_label',    'Retorno acumulado 24m'],
    ],
  },

  // -------------------------- 18. ESTRATEGIA · STEPS --------------------------
  {
    name: 'Estrategia-Steps',
    headers: ['order', 'mes', 'titulo', 'note'],
    colWidths: [60, 90, 320, 380],
    rows: [
      [1, 'Mes 0',  'Aportación $1M en Casa Alysa',          'Capital al 25% anual preferente.'],
      [2, 'Mes 8',  'Alysa cierra: $1.16M recuperado',       'Yield + capital de regreso.'],
      [3, 'Mes 9',  'Reinversión en lotes Fundadores II',    'Aprox. terreno 311 m² en Real Miramar.'],
      [4, 'Mes 18', 'Urbanización · escrituración',          'Hitos verificables del fraccionamiento.'],
      [5, 'Mes 24', 'Terreno con valor de $1.78M',           'Retorno acumulado ~78%.'],
    ],
  },

  // -------------------------- 19. GARANTÍAS --------------------------
  {
    name: 'Garantias-Hero',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',        'Marco de protección al inversionista'],
      ['display_line1', 'Tu seguridad no depende'],
      ['display_line2', 'de la confianza.'],
      ['lead',          'Depende de la ley, del notario, del Registro Público de la Propiedad, y de las cláusulas escritas del contrato.'],
    ],
  },
  {
    name: 'Garantias-Cards',
    headers: ['order', 'numero', 'titulo', 'cuerpo'],
    colWidths: [60, 70, 240, 520],
    rows: [
      [1, '01', 'Escritura Individual',     'Tu participación en escritura pública ante notario, registrada. Si Yodesarrollo desaparece mañana, tu porcentaje sigue siendo tuyo.'],
      [2, '02', 'Cuenta Exclusiva',         'Cada peso aportado se deposita en cuenta a nombre del proyecto. Reportes trimestrales. Auditoría a solicitud.'],
      [3, '03', 'Activo Tangible',          'No es un fideicomiso opaco. Es ladrillo y cemento que puedes tocar, visitar, fotografiar cuando quieras.'],
      [4, '04', 'Tres Opciones de Salida',  'Si pasados 8 meses la casa no se vende: esperar (tasa preferente sigue corriendo) / vender tu porcentaje a un tercero / vender a un copropietario que quiera aumentar su participación.'],
      [5, '05', 'Marco Legal',              'Operación amparada por los Artículos 938–979 del Código Civil Federal sobre copropiedad pro-indiviso, una de las figuras más sólidas del derecho civil mexicano.'],
    ],
  },

  // -------------------------- 20. CRONOGRAMA --------------------------
  {
    name: 'Cronograma-Hero',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',       'Hitos y ventana de oportunidad · Mayo 2026 → Mayo 2028'],
      ['display',      'El momento importa.'],
      ['lead',         'No es presión comercial. Es matemática del mercado: conforme avanza el proyecto, baja el riesgo y sube el precio.'],
      ['stat_1_value', '$1M'],
      ['stat_1_label', 'Cupo Alysa restante'],
      ['stat_2_value', '2/6'],
      ['stat_2_label', 'Lotes preventa Miramar'],
      ['stat_3_value', '+27%'],
      ['stat_3_label', 'F.II → Precio Venta · 12m'],
      ['stat_4_value', '+10%'],
      ['stat_4_label', 'Plusvalía anual después'],
      ['total_meses',  24],
    ],
  },
  {
    name: 'Cronograma-Meses',
    headers: ['mes', 'label'],
    colWidths: [60, 120],
    rows: [
      [0,  'May 26'],
      [2,  'Jul 26'],
      [4,  'Sep 26'],
      [6,  'Nov 26'],
      [8,  'Ene 27'],
      [10, 'Mar 27'],
      [12, 'May 27'],
      [14, 'Jul 27'],
      [16, 'Sep 27'],
      [18, 'Nov 27'],
      [20, 'Ene 28'],
      [22, 'Mar 28'],
      [24, 'May 28'],
    ],
  },
  {
    name: 'Cronograma-Alysa-Hitos',
    headers: ['mes', 'label', 'note'],
    colWidths: [60, 220, 320],
    rows: [
      [0,  'HOY · 80% obra',  ''],
      [4,  'Acabados',         'Casa terminada'],
      [8,  'Venta estimada',   'Cierre y reparto'],
      [10, 'Venta máx.',       'Salida tope'],
    ],
  },
  {
    name: 'Cronograma-Miramar-Hitos',
    headers: ['mes', 'label', 'price', 'gain', 'hi', 'bigDot'],
    colWidths: [60, 220, 130, 100, 70, 80],
    rows: [
      [0,  'Fundadores II', '$3,750/m²', 'HOY',    'TRUE',  'FALSE'],
      [4,  'Preventa I',    '$4,075/m²', '+8.7%',  'FALSE', 'FALSE'],
      [8,  'Preventa II',   '$4,325/m²', '+15.3%', 'FALSE', 'FALSE'],
      [12, 'Precio Venta',  '$4,750/m²', '+26.7%', 'FALSE', 'TRUE'],
      [24, 'Año 2 mercado', '$5,225/m²', '+39.3%', 'FALSE', 'TRUE'],
    ],
  },
  {
    name: 'Cronograma-Bullets-Alysa',
    headers: ['order', 'mes_label', 'titulo', 'descripcion'],
    colWidths: [60, 130, 220, 420],
    rows: [
      [1, 'Mes 0 (Mayo 26)',  'obra al 80%',          'inicia ventana de coinversión.'],
      [2, 'Mes 4 (Sep 26)',   'acabados terminados',  'casa lista para vender.'],
      [3, 'Mes 8 (Ene 27)',   'venta estimada',       'y cierre con el inversionista.'],
      [4, 'Mes 10 (Mar 27)',  'plazo máximo de venta','si no se vende, opciones de salida del contrato.'],
    ],
  },
  {
    name: 'Cronograma-Bullets-Miramar',
    headers: ['order', 'mes_label', 'titulo', 'precio', 'extra'],
    colWidths: [60, 140, 200, 130, 200],
    rows: [
      [1, 'Mes 0',           'Fundadores II HOY', '$3,750/m²', ''],
      [2, 'Mes 4',           'Preventa I',        '$4,075/m²', '(+8.7%)'],
      [3, 'Mes 8',           'Preventa II',       '$4,325/m²', '(+15.3%)'],
      [4, 'Mes 12',          'Precio Venta',      '$4,750/m²', '(+26.7%)'],
      [5, 'Año 2 (mes 24)',  'mercado consolidado','$5,225/m²','(+39.3%)'],
    ],
  },
  {
    name: 'Cronograma-Quote',
    headers: ['key', 'value'],
    colWidths: [120, 680],
    rows: [
      ['quote', 'Los mejores inversionistas que he conocido entran en momentos de incertidumbre — porque ahí está el mejor precio. La certeza la pagas en plusvalía perdida.'],
    ],
  },

  // -------------------------- 21. DECISIÓN --------------------------
  {
    name: 'Decision-Hero',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',        'Acto IV · Tu decisión'],
      ['display_line1', '¿Cuál de los cuatro'],
      ['display_line2', 'caminos te acomoda?'],
      ['lead',          'Si entras hoy, lo haces con escritura, con garantías, con plazo claro. Si decides que aún no es momento, te respetamos tu tiempo y te enviamos toda la información para que la revises con calma.'],
    ],
  },
  {
    name: 'Decision-Paths',
    headers: ['letra', 'titulo', 'sub', 'descripcion', 'cta', 'strong'],
    colWidths: [60, 200, 200, 420, 200, 70],
    rows: [
      ['A', 'Reservo hoy',          '$30,000 reembolsables', 'Aparta tu lugar en cupo Alysa o lote fundador II. Si no avanzas en 7 días, devolución total.', 'Llenar reserva',      'TRUE'],
      ['B', 'Visito la obra',       'esta semana',           'Recorrido privado en Casa Alysa o Real Miramar con el equipo de obra.',                         'Agendar visita',      'FALSE'],
      ['C', 'Reviso con asesor',    'o pareja',              'Te enviamos el dossier completo + grabación de esta sesión.',                                  'Recibir documentos',  'FALSE'],
      ['D', 'No es para mí',        'en este momento',       'Lo respetamos. Te quedas en la lista para edición fundadora 2027.',                            'Cerrar conversación', 'FALSE'],
    ],
  },

  // -------------------------- 22. CONTACTO --------------------------
  {
    name: 'Contacto-Hero',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',        'Tu siguiente paso'],
      ['display_line1', 'Construyamos'],
      ['display_line2', 'juntos.'],
      ['lead',          'El patrimonio no se construye en reuniones. Se construye en las decisiones que tomas después de ellas.'],
    ],
  },
  {
    name: 'Contacto-Asesor',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['kicker',     'Asesor patrimonial'],
      ['nombre',     'Alejandro Puebla Gayón'],
      ['rol',        'Master Developer · Yodesarrollo SAPI'],
      ['whatsapp',   '+52 — — —'],
      ['correo',     'contacto@yodesarrollo.mx'],
      ['web',        'yodesarrollo.mx'],
      ['oficina',    'Hermosillo · Sonora'],
    ],
  },
  {
    name: 'Contacto-Docs',
    headers: ['order', 'titulo', 'meta', 'url'],
    colWidths: [60, 320, 140, 320],
    rows: [
      [1, 'Carpeta de inversión completa',     'PDF · 13 pp',   ''],
      [2, 'Dossier de diagnóstico patrimonial','PDF · 4 pp',    ''],
      [3, 'Casa Alysa — ficha técnica',         'PDF · 16 pp',   ''],
      [4, 'Real Miramar — plano maestro',       'PDF · 17 pp',   ''],
      [5, 'Modelo de contrato de copropiedad',  'PDF · borrador',''],
    ],
  },
  {
    name: 'Contacto-CTA',
    headers: ['key', 'value'],
    colWidths: [180, 600],
    rows: [
      ['titulo',  'Agenda visita privada'],
      ['cuerpo',  'Una hora en sitio vale más que diez en pantalla. Te llevamos a Altozano o a Guaymas, recorremos contigo y resolvemos dudas con el notario presente si lo necesitas.'],
      ['cta',     'Agendar esta semana'],
      ['url',     ''],
    ],
  },
];
