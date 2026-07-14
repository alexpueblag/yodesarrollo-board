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

// ---------------------------------------------------------------------------
// Fetch con timeout
// ---------------------------------------------------------------------------
const fetchWithTimeout = (url, ms) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal, credentials: "omit" })
    .then((r) => { clearTimeout(tid); return r; })
    .catch((e) => { clearTimeout(tid); throw e; });
};

// Credencial del Portero (la escribe portero.js al canjear la liga / clave / Google)
const credencial = () => {
  try { return localStorage.getItem(PORTERO_LSK) || ""; } catch (e) { return ""; }
};

// Credencial rechazada por el servidor: limpiar todo y dejar que el Portero pida acceso de nuevo.
const PYOD_EXEC = "https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec";
const _pyodCerrar = () => {
  cacheClear();
  try { localStorage.removeItem(PORTERO_LSK); sessionStorage.removeItem("pyod_rol"); } catch (e) {}
  location.reload();
};
const _pyodAviso = () => {
  if (document.getElementById("pyodAviso")) return;
  const d = document.createElement("div");
  d.id = "pyodAviso";
  d.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;max-width:min(560px,92vw);background:#221E17;color:#F1EDE3;border:1px solid rgba(255,255,255,.14);border-left:3px solid #B98B3C;border-radius:12px;padding:14px 16px;font-family:'Instrument Sans',system-ui,sans-serif;font-size:13px;line-height:1.5;box-shadow:0 18px 48px rgba(0,0,0,.5)";
  d.innerHTML = '<b style="color:#B98B3C">Tu sesión es válida.</b> Este tablero no validó tu acceso: su backend (Apps Script) necesita re-desplegarse. Tu sesión NO se cerró. <a href="https://alexpueblag.github.io/yod-portal/os/" style="color:#B98B3C">Volver a YOD OS</a> · <button id="pyodAvX" style="background:none;border:0;color:#8A8272;cursor:pointer;text-decoration:underline;font:inherit">Ocultar</button>';
  document.body.appendChild(d);
  const x = document.getElementById("pyodAvX");
  if (x) x.onclick = () => d.remove();
};
const credencialRechazada = () => {
  let k = "";
  try { k = localStorage.getItem(PORTERO_LSK) || ""; } catch (e) {}
  if (!k) { _pyodCerrar(); return; }
  fetch(PYOD_EXEC + "?recurso=canje&t=" + encodeURIComponent(k), { credentials: "omit" })
    .then((r) => r.json())
    .then((j) => { if (j && j.ok) _pyodAviso(); else _pyodCerrar(); })
    .catch(() => _pyodAviso());
};

const fetchLive = async () => {
  const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
  if (!url) throw new Error("no_apps_script_url");
  const k = credencial();
  if (!k) throw new Error("sin_credencial");
  const res = await fetchWithTimeout(url + (url.indexOf("?") === -1 ? "?" : "&") + "k=" + encodeURIComponent(k), FETCH_TIMEOUT);
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
  const [data, setData]     = React.useState(null);
  const [status, setStatus] = React.useState("loading");   // loading | ready | error
  const [source, setSource] = React.useState(null);        // cache | live

  const load = React.useCallback(async () => {
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
      const live = await fetchLive();
      cacheWrite(live);
      setData(live);
      setStatus("ready");
      setSource("live");
    } catch (e) {
      console.warn("[data-loader] revalidación en segundo plano falló:", e.message);
      if (!shown) setStatus("error");  // solo es error si nunca logramos mostrar nada
    }
  }, []);

  const refresh = React.useCallback(() => load(), [load]);

  const save = React.useCallback(async (action, payload) => {
    const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
    if (!url) throw new Error("no_apps_script_url");
    // text/plain evita preflight CORS de Apps Script
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data: payload, k: credencial() }),
      credentials: "omit",
    });
    const json = await res.json();
    if (!json.ok) {
      if (json.error === "liga") credencialRechazada();
      throw new Error(json.error || "save_failed");
    }
    return json;
  }, []);

  React.useEffect(() => { load(); }, [load]);

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
      <span className="dl-text mono">No se pudo cargar la data.</span>
      <button className="foot-cta" onClick={onRetry}>Reintentar</button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Indicador de fuente (esquinita inferior derecha cuando NO es live)
// ---------------------------------------------------------------------------
const DataSourceBadge = () => {
  const { source, refresh } = window.useData();
  if (source === "live") return null;
  const label = source === "cache" ? "caché local" : "—";
  return (
    <button className="data-source-badge" onClick={refresh} title="Recargar desde Sheets">
      <span className="dsb-dot" data-src={source}></span>
      <span className="dsb-label mono">{label}</span>
      <span className="dsb-action mono">⟳</span>
    </button>
  );
};

Object.assign(window, { DataContext, DataProvider, DataLoadingView, DataErrorView, DataSourceBadge });
