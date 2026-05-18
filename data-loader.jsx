// Yodesarrollo-Board · Data Loader
//
// Carga híbrida:
//   1. Si hay caché fresco en localStorage (< 5 min) → usa ese
//   2. Sino: fetch al Apps Script /exec
//   3. Si Apps Script tarda > 3 seg o falla → cae a data.json local
//   4. Si fetch live tiene éxito, sobrescribe caché y notifica
//
// Expone:
//   - DataContext (React.createContext)
//   - useData()         → { data, status, source, refresh, save }
//   - <DataProvider />  → wrapper que orquesta el ciclo
//
// La URL del Apps Script vive en window.YDR_CONFIG.appsScriptUrl (ver index.html)

const CACHE_KEY      = "ydr_board_data_v1";
const CACHE_TTL_MS   = 5 * 60 * 1000;     // 5 minutos
const FETCH_TIMEOUT  = 3000;              // 3 segundos
const FALLBACK_URL   = "data.json";

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
  return fetch(url, { signal: ctrl.signal })
    .then((r) => { clearTimeout(tid); return r; })
    .catch((e) => { clearTimeout(tid); throw e; });
};

const fetchLive = async () => {
  const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
  if (!url) throw new Error("no_apps_script_url");
  const res = await fetchWithTimeout(url, FETCH_TIMEOUT);
  if (!res.ok) throw new Error("http_" + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error("api_error:" + (json.error || "unknown"));
  return json.data;
};

const fetchFallback = async () => {
  const res = await fetch(FALLBACK_URL);
  if (!res.ok) throw new Error("fallback_http_" + res.status);
  return await res.json();
};

// ---------------------------------------------------------------------------
// DataProvider
// ---------------------------------------------------------------------------
const DataProvider = ({ children }) => {
  const [data, setData]     = React.useState(null);
  const [status, setStatus] = React.useState("loading");   // loading | ready | error
  const [source, setSource] = React.useState(null);        // cache | live | fallback

  const load = React.useCallback(async (forceLive = false) => {
    // 1. Caché fresco
    if (!forceLive) {
      const cached = cacheRead();
      if (cached) {
        setData(cached);
        setStatus("ready");
        setSource("cache");
        // refresca en background sin bloquear
        fetchLive().then((live) => {
          cacheWrite(live);
          setData(live);
          setSource("live");
        }).catch(() => { /* mantiene caché */ });
        return;
      }
    }

    setStatus("loading");

    // 2. Apps Script live (con timeout)
    try {
      const live = await fetchLive();
      cacheWrite(live);
      setData(live);
      setStatus("ready");
      setSource("live");
      return;
    } catch (e) {
      console.warn("[data-loader] live fetch falló:", e.message);
    }

    // 3. Fallback al JSON local
    try {
      const fb = await fetchFallback();
      setData(fb);
      setStatus("ready");
      setSource("fallback");
    } catch (e) {
      console.error("[data-loader] fallback también falló:", e.message);
      setStatus("error");
    }
  }, []);

  const refresh = React.useCallback(() => {
    cacheClear();
    return load(true);
  }, [load]);

  const save = React.useCallback(async (action, payload) => {
    const url = (window.YDR_CONFIG && window.YDR_CONFIG.appsScriptUrl) || "";
    if (!url) throw new Error("no_apps_script_url");
    // text/plain evita preflight CORS de Apps Script
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data: payload }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "save_failed");
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
      <div className="dl-pulse"></div>
      <span className="dl-text mono">Cargando board…</span>
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
  const label = source === "cache" ? "caché local" : source === "fallback" ? "offline · data.json" : "—";
  return (
    <button className="data-source-badge" onClick={refresh} title="Recargar desde Sheets">
      <span className="dsb-dot" data-src={source}></span>
      <span className="dsb-label mono">{label}</span>
      <span className="dsb-action mono">⟳</span>
    </button>
  );
};

Object.assign(window, { DataContext, DataProvider, DataLoadingView, DataErrorView, DataSourceBadge });
