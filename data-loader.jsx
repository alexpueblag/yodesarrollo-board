// Yodesarrollo-Board · Data Loader
//
// Carga "instantánea" (pinta-ya, revalida-después / stale-while-revalidate):
//   1. Al abrir, pinta AL INSTANTE lo último disponible en caché local del dispositivo.
//   2. EN SEGUNDO PLANO busca lo más fresco del Apps Script (sin bloquear la pantalla ya pintada).
//   3. Cuando llega lo fresco, actualiza la vista solo y lo guarda en caché.
//   4. Si el Apps Script no responde, se queda con lo que ya mostró. Sin loader largo.
//
// Acceso: toda petición viaja con la credencial del Portero (localStorage pyod_clave_v1:
// liga mágica, clave de equipo o sesión de Google). El backend la valida en el servidor
// y sin ella no entrega datos. Ya no existe data.json público.
//
// Expone:
//   - DataContext (React.createContext)
//   - useData()         → { data, status, source, refresh, save }
//   - <DataProvider />  → wrapper que orquesta el ciclo
//
// La URL del Apps Script vive en window.YDR_CONFIG.appsScriptUrl (ver index.html)

const CACHE_KEY      = "ydr_board_data_v1";
const CACHE_TTL_MS   = 5 * 60 * 1000;     // 5 minutos (solo informativo; ya no bloquea el arranque)
const FETCH_TIMEOUT  = 15000;             // 15 s para la revalidación en segundo plano (no bloquea la pantalla)
const PORTERO_LSK    = "pyod_clave_v1";   // misma llave que usa portero.js

const DataContext = React.createContext(null);
window.useData = () => React.useContext(DataContext);

// ---------------------------------------------------------------------------
// Helpers de caché
// ---------------------------------------------------------------------------
const cacheRead = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch (e) { return null; }
};

// Lee la caché sin importar su antigüedad — solo se usa de emergencia cuando la red falló.
const cacheReadAny = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).data || null;
  } catch (e) { return null; }
};

const cacheWrite = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) { /* localStorage lleno o desactivado, ignorar */ }
};

const cacheClear = () => {
  try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
};

// Antigüedad del dato guardado. Se muestra junto al dato para que nadie
// confunda una copia de hace semanas con información de hoy.
const cacheTs = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw).ts || null) : null;
  } catch (e) { return null; }
};

window.ydrEdadTexto = (ts) => {
  if (!ts) return "";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 2)   return "hace un momento";
  if (min < 60)  return "hace " + min + " min";
  const h = Math.floor(min / 60);
  if (h < 24)    return "hace " + h + (h === 1 ? " hora" : " horas");
  const d = Math.floor(h / 24);
  if (d < 31)    return "hace " + d + (d === 1 ? " día" : " días");
  const me = Math.floor(d / 30);
  return "hace " + me + (me === 1 ? " mes" : " meses");
};

// ---------------------------------------------------------------------------
// Capa de overrides (Modo Edición v1)
//
// Ediciones locales guardadas en localStorage ydr_overrides_v1 con formato
//   [{ path:"cronograma.hero.stat_1_value", old:"$500K", val:"$600K", ts:169... }]
// Se aplican ENCIMA de la data (caché o live) al entregarla, así el board
// siempre muestra lo editado aunque el Sheet todavía no se toque (eso es v2).
// ---------------------------------------------------------------------------
const OVERRIDES_KEY = "ydr_overrides_v1";

const ovRead = () => {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
};

const ovWrite = (list) => {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(list)); } catch (e) {}
};

// Deep-set por path "a.b.0.c" (soporta índices de arreglo). No crea ramas
// inexistentes: si la ruta ya no existe en la data fresca, el override se ignora.
const ovDeepSet = (obj, path, val) => {
  const parts = String(path).split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = Array.isArray(node) ? parseInt(parts[i], 10) : parts[i];
    if (node == null || node[key] == null || typeof node[key] !== "object") return false;
    node = node[key];
  }
  const last = Array.isArray(node) ? parseInt(parts[parts.length - 1], 10) : parts[parts.length - 1];
  if (node == null || !(last in node)) return false;
  node[last] = val;
  return true;
};

const ovApply = (data) => {
  const list = ovRead();
  if (!data || !list.length) return data;
  let clone;
  try { clone = JSON.parse(JSON.stringify(data)); } catch (e) { return data; }
  list.forEach((o) => { try { ovDeepSet(clone, o.path, o.val); } catch (e) {} });
  return clone;
};

// API pública para edit-mode.jsx (con suscripción para re-render)
const ovListeners = new Set();
const ovNotify = () => ovListeners.forEach((fn) => { try { fn(); } catch (e) {} });
window.YDR_OVERRIDES = {
  list: ovRead,
  add(o) {
    const list = ovRead().filter((x) => x.path !== o.path); // 1 override vigente por ruta
    list.push({ ...o, ts: o.ts || Date.now() });
    ovWrite(list); ovNotify();
  },
  remove(path) { ovWrite(ovRead().filter((x) => x.path !== path)); ovNotify(); },
  clear() { ovWrite([]); ovNotify(); },
  subscribe(fn) { ovListeners.add(fn); return () => ovListeners.delete(fn); },
};

// ---------------------------------------------------------------------------
// Fetch con timeout
// ---------------------------------------------------------------------------
const fetchWithTimeout = (url, ms) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then((r) => { clearTimeout(tid); return r; })
    .catch((e) => { clearTimeout(tid); throw e; });
};

// Credencial del Portero (la escribe portero.js al canjear la liga / clave / Google)
const credencial = () => {
  try { return localStorage.getItem(PORTERO_LSK) || ""; } catch (e) { return ""; }
};

// Credencial rechazada por el backend de ESTE tablero.
//
// REGLA DE ORO: NUNCA borramos la credencial compartida del Portero (pyod_clave_v1).
// Ese token es la sesión de TODO el YOD OS; otros tableros y el hub lo aceptan. Que el
// backend de un tablero la rechace (porque su Apps Script está por re-desplegarse, o
// porque este correo no tiene permiso para ESTE board) NO significa que la sesión global
// sea inválida. Borrarla aquí sacaba al usuario de TODO el OS con solo abrir este board
// (y, al recargar, el Portero volvía a pedir acceso → "rebota y se autocarga").
//
// En vez de eso mostramos un aviso NO destructivo (como hace Tesorería) y dejamos la
// sesión intacta. Si el token de verdad expiró, el usuario cierra sesión a mano con el
// botón de la vista de error.
let SIN_ACCESO_TABLERO = false;
const cerrarSesionManual = () => {
  try { localStorage.removeItem(PORTERO_LSK); sessionStorage.removeItem("pyod_rol"); } catch (e) {}
  location.reload();
};
const credencialRechazada = () => {
  cacheClear();
  SIN_ACCESO_TABLERO = true;
};

const fetchLive = async (forceRefresh = false) => {
  const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
  if (!url) throw new Error("no_apps_script_url");
  const k = credencial();
  if (!k) throw new Error("sin_credencial");
  const query = "k=" + encodeURIComponent(k) + (forceRefresh ? "&refresh=1" : "");
  const res = await fetchWithTimeout(url + (url.indexOf("?") === -1 ? "?" : "&") + query, FETCH_TIMEOUT);
  if (!res.ok) throw new Error("http_" + res.status);
  const json = await res.json();
  if (!json.ok) {
    if (json.error === "liga") credencialRechazada();
    throw new Error("api_error:" + (json.error || "unknown"));
  }
  return json.data;
};

// ---------------------------------------------------------------------------
// DataProvider
// ---------------------------------------------------------------------------
const DataProvider = ({ children }) => {
  const [rawData, setData]  = React.useState(null);
  const [status, setStatus] = React.useState("loading");   // loading | ready | error
  const [source, setSource] = React.useState(null);        // cache | live

  const load = React.useCallback(async (forceRefresh = false) => {
    // 1. PINTA YA — muestra al instante lo último disponible para que el cliente nunca espere.
    let shown = false;
    const cached = cacheReadAny();
    if (cached) {
      setData(cached);
      setStatus("ready");
      setSource("cache");
      shown = true;
    }

    // 2. REVALIDA EN SEGUNDO PLANO — trae lo más fresco sin bloquear lo ya pintado.
    try {
      const live = await fetchLive(forceRefresh);
      cacheWrite(live);
      setData(live);
      setStatus("ready");
      setSource("live");
      SIN_ACCESO_TABLERO = false;  // token válido → limpia cualquier aviso previo
    } catch (e) {
      console.warn("[data-loader] revalidación en segundo plano falló:", e.message);
      if (!shown) setStatus("error");  // solo es error si nunca logramos mostrar nada
    }
  }, []);

  const refresh = React.useCallback(() => load(true), [load]);

  const save = React.useCallback(async (action, payload) => {
    const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
    if (!url) throw new Error("no_apps_script_url");
    // text/plain evita preflight CORS de Apps Script
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data: payload, k: credencial() }),
    });
    const json = await res.json();
    if (!json.ok) {
      if (json.error === "liga") credencialRechazada();
      throw new Error(json.error || "save_failed");
    }
    return json;
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Overrides locales (Modo Edición): re-aplicar cuando cambian
  const [ovTick, setOvTick] = React.useState(0);
  React.useEffect(() => window.YDR_OVERRIDES.subscribe(() => setOvTick((t) => t + 1)), []);
  const data = React.useMemo(() => ovApply(rawData), [rawData, ovTick]);

  const value = { data, status, source, refresh, save };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Loading view (mientras data == null)
// ---------------------------------------------------------------------------
const DataLoadingView = () => (
  <div className="data-loading">
    <div className="dl-inner">
      <img src="assets/logo_white.png" alt="Yodesarrollo" className="dl-logo" />
      <span className="dl-text mono">Cargando la información más reciente…</span>
    </div>
  </div>
);

const DataErrorView = ({ onRetry }) => (
  <div className="data-loading">
    <div className="dl-inner">
      {SIN_ACCESO_TABLERO ? (
        <React.Fragment>
          <span className="dl-text mono">No pudimos validar tu acceso a este tablero.</span>
          <span className="dl-text mono" style={{ opacity: .7, fontSize: "12px", maxWidth: "360px", textAlign: "center", lineHeight: 1.5 }}>
            Tu sesión sigue activa en los demás tableros del YOD OS. Si el problema
            persiste, el backend de este tablero puede necesitar re-despliegue.
          </span>
          <div style={{ display: "flex", gap: "10px", marginTop: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            <a className="foot-cta" href="https://alexpueblag.github.io/yod-portal/os/">Volver a YOD OS</a>
            <button className="foot-cta" onClick={onRetry}>Reintentar</button>
            <button className="foot-cta" style={{ opacity: .7 }} onClick={cerrarSesionManual}>Cerrar sesión</button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <span className="dl-text mono">No se pudo cargar la data.</span>
          <button className="foot-cta" onClick={onRetry}>Reintentar</button>
        </React.Fragment>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Indicador de fuente (esquinita inferior derecha cuando NO es live)
// ---------------------------------------------------------------------------
const DataSourceBadge = () => {
  const { source, refresh } = window.useData();
  const [, tick] = React.useReducer((x) => x + 1, 0);
  // Refresca la etiqueta cada minuto: si el board queda abierto, la edad sigue viva.
  React.useEffect(() => { const id = setInterval(tick, 60000); return () => clearInterval(id); }, []);
  if (source === "live") return null;
  const ts = cacheTs();
  const edad = window.ydrEdadTexto(ts);
  const label = source === "cache" ? "caché local" : "—";
  const viejo = ts && (Date.now() - ts) > 48 * 3600 * 1000;
  return (
    <button className="data-source-badge" onClick={refresh}
      data-viejo={viejo ? "1" : null}
      title={ts ? "Datos guardados el " + new Date(ts).toLocaleString("es-MX") + " · clic para recargar" : "Recargar desde Sheets"}>
      <span className="dsb-dot" data-src={source}></span>
      <span className="dsb-label mono">{label}{edad ? " · datos de " + edad : ""}</span>
      <span className="dsb-action mono">⟳</span>
    </button>
  );
};

Object.assign(window, { DataContext, DataProvider, DataLoadingView, DataErrorView, DataSourceBadge });
