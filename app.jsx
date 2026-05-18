// Board principal — Yodesarrollo. Datos servidos por DataProvider (Sheets → JSON → cache).

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// --- Mapping: id de tile (viene del Sheet) → componente React ---
// Los datos viven en Sheets, los componentes viven aquí.
const ICON_BY_ID = {
  "diagnostico":  IconDiagnostico,
  "comparativo":  IconComparativo,
  "casa-alysa":   IconCasaAlysa,
  "real-miramar": IconRealMiramar,
  "calculadora":  IconCalculadora,
  "estrategia":   IconEstrategia,
  "garantias":    IconGarantias,
  "cronograma":   IconCronograma,
  "decision":     IconDecision,
  "contacto":     IconContacto,
};

const SECTION_BY_ID = {
  "diagnostico":  SecDiagnostico,
  "comparativo":  SecComparativo,
  "casa-alysa":   SecCasaAlysa,
  "real-miramar": SecRealMiramar,
  "calculadora":  SecCalculadora,
  "estrategia":   SecEstrategia,
  "garantias":    SecGarantias,
  "cronograma":   SecCronograma,
  "decision":     SecDecision,
  "contacto":     SecContacto,
};

const ACTOS = [
  { n: "I",   label: "Diagnóstico" },
  { n: "II",  label: "Análisis comparado" },
  { n: "III", label: "Tu oportunidad" },
  { n: "IV",  label: "Decisión" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "carplay",
  "showActos": false,
  "showClock": true,
  "client": ""
}/*EDITMODE-END*/;

// Útil para que sections.jsx pueda hacer navigate(id) y resolver el tile
window.buildTileLookup = (tilesData) => {
  const lookup = {};
  (tilesData || []).forEach((row) => {
    if (row.enabled === false) return;
    lookup[row.id] = {
      ...row,
      Icon:    ICON_BY_ID[row.id]    || (() => null),
      Section: SECTION_BY_ID[row.id] || (() => null),
    };
  });
  return lookup;
};

const useClock = () => {
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return t;
};

const fmtTime = (d) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDate = (d) => d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

// --------------------------- Dashboard ---------------------------
const Dashboard = ({ onOpen, t }) => {
  const clock = useClock();
  const { data } = window.useData();
  const cfg = data.config || {};
  const tiles = (data.tiles || [])
    .filter((row) => row.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((row) => ({
      ...row,
      Icon:    ICON_BY_ID[row.id]    || (() => null),
      Section: SECTION_BY_ID[row.id] || (() => null),
    }));

  const logoSrc = cfg.logo_url || "assets/logo_white.png";

  return (
    <div className={"board board--" + t.aesthetic}>
      <header className="board-head">
        <div className="brand">
          <img src={logoSrc} alt="Yodesarrollo" className="brand-logo" />
          <div className="brand-meta">
            <span className="brand-name mono">{cfg.brand_name || "YODESARROLLO · INVERSIÓN PATRIMONIAL"}</span>
            <span className="brand-sub">
              {t.client
                ? <>Reunión con <em>{t.client}</em></>
                : (cfg.brand_sub_default || "Edición fundadora · 2026")}
            </span>
          </div>
        </div>
        <div className="head-right-row">
          <div className="head-stats">
            <span className="hs-item">
              <span className="hs-label mono">{cfg.header_stat_1_label}</span>{" "}
              <span className="hs-value mono accent">{cfg.header_stat_1_value}</span>
            </span>
            <span className="hs-dot">·</span>
            <span className="hs-item">
              <span className="hs-label mono">{cfg.header_stat_2_label}</span>{" "}
              <span className="hs-value mono accent">{cfg.header_stat_2_value}</span>
            </span>
            <span className="hs-dot">·</span>
            <span className="hs-item">
              <span className="hs-label mono">{cfg.header_stat_3_label}</span>{" "}
              <span className="hs-value mono">{cfg.header_stat_3_value}</span>
            </span>
          </div>
          {t.showClock && cfg.show_clock !== false && (
            <div className="board-status">
              <span className="status-time mono">{fmtTime(clock)}</span>
              <span className="status-date">{fmtDate(clock)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="tile-grid">
        {tiles.map((tile, i) => (
          <div key={tile.id} className="tile-item">
            <button
              className="tile"
              style={{ ["--c"]: tile.color, ["--a"]: tile.accent }}
              onClick={() => onOpen(tile.id)}
            >
              <span className="tile-halo" aria-hidden></span>
              <span className="tile-accent" aria-hidden></span>
              <span className="tile-roman">{ROMANS[i]}</span>
              <div className="tile-icon">
                <tile.Icon size={56} sw={1.5} />
              </div>
              <div className="tile-meta">
                <span className="tile-label">{tile.label}</span>
                <span className="tile-rule" aria-hidden></span>
                <span className="tile-kicker mono">{tile.kicker}</span>
              </div>
            </button>
            <span className="tile-caption">{tile.label}</span>
          </div>
        ))}
      </div>

      <footer className="board-foot">
        <div className="foot-left">
          <span className="mono small muted">{cfg.foot_left || "CARPETA DE INVERSIÓN"}</span>
        </div>
        <button className="foot-cta" onClick={() => onOpen("diagnostico")}>
          {cfg.foot_cta || "Empezar por el diagnóstico"} <IconArrow size={14} sw={2} />
        </button>
      </footer>
    </div>
  );
};

// --------------------------- Section view ---------------------------
const SectionView = ({ id, onHome, onNavigate }) => {
  const { data } = window.useData();
  const tilesById = window.buildTileLookup(data.tiles);
  const tile = tilesById[id];
  if (!tile) return null;
  const C = tile.Section;
  return (
    <div className="section-wrap" key={id}>
      <C tile={tile} onHome={onHome} navigate={onNavigate} />
    </div>
  );
};

// --------------------------- App con DataProvider ---------------------------
const AppShell = () => {
  const { data, status, refresh } = window.useData();

  const readHash = () => (location.hash || "").replace(/^#/, "") || null;
  const [view, setView] = React.useState(readHash());
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    document.body.dataset.aesthetic = t.aesthetic;
  }, [t.aesthetic]);

  // Aplica defaults del Sheet (Config) cuando data llega
  React.useEffect(() => {
    if (!data || !data.config) return;
    if (data.config.default_aesthetic && t.aesthetic === TWEAK_DEFAULTS.aesthetic) {
      setTweak("aesthetic", data.config.default_aesthetic);
    }
    if (data.config.default_client && !t.client) {
      setTweak("client", data.config.default_client);
    }
  }, [data]);

  const open = (id) => { location.hash = id; setView(id); };
  const home = () => { location.hash = ""; setView(null); };

  if (status === "loading" && !data) return <DataLoadingView />;
  if (status === "error" && !data)   return <DataErrorView onRetry={refresh} />;

  return (
    <div className="app">
      {view ? (
        <SectionView id={view} onHome={home} onNavigate={open} />
      ) : (
        <Dashboard onOpen={open} t={t} />
      )}

      <DataSourceBadge />

      <TweaksPanel>
        <TweakSection label="Estética del board" />
        <TweakRadio
          label="Estilo"
          value={t.aesthetic}
          options={["carplay", "editorial", "mono"]}
          onChange={(v) => setTweak("aesthetic", v)}
        />
        <TweakSection label="Cabecera" />
        <TweakToggle label="Mostrar reloj" value={t.showClock} onChange={(v) => setTweak("showClock", v)} />
        <TweakText label="Nombre del cliente" value={t.client} placeholder="Ej. Sr. Hernández"
          onChange={(v) => setTweak("client", v)} />
        <TweakSection label="Datos" />
        <button className="tweak-btn" onClick={refresh}>
          Recargar desde Sheets ⟳
        </button>
      </TweaksPanel>
    </div>
  );
};

const App = () => (
  <DataProvider>
    <AppShell />
  </DataProvider>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
